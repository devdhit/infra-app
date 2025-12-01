/**
 * Role repository
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';
import type {
  Role,
  RoleWithUsers,
  CreateRoleData,
  UpdateRoleData,
  RolePermissions,
  UUID,
} from '@/types/management';

export class RoleRepository extends BaseRepository<Role> {
  protected readonly modelName = 'role';

  /**
   * Find role by name and tenant
   */
  async findByNameAndTenant(name: string, tenantId: UUID): Promise<Role | null> {
    const role = await db.role.findUnique({
      where: {
        name_tenantId: {
          name,
          tenantId,
        },
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) return null;

    return this.mapToRole(role);
  }

  /**
   * Find role with users
   */
  async findByIdWithUsers(id: UUID): Promise<RoleWithUsers | null> {
    const role = await db.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) return null;

    return this.mapToRoleWithUsers(role);
  }

  /**
   * Find all roles for a tenant
   */
  async findByTenant(tenantId: UUID): Promise<readonly Role[]> {
    const roles = await db.role.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(r => this.mapToRole(r));
  }

  /**
   * Create role
   */
  async createRole(data: CreateRoleData, tenantId: UUID): Promise<Role> {
    const role = await db.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        permissions: JSON.parse(JSON.stringify(data.permissions)),
        tenantId,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return this.mapToRole(role as unknown as DbRoleWithCount);
  }

  /**
   * Update role
   */
  async updateRole(id: UUID, data: UpdateRoleData): Promise<Role> {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.permissions !== undefined) {
      updateData.permissions = JSON.parse(JSON.stringify(data.permissions));
    }

    const role = await db.role.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return this.mapToRole(role as unknown as DbRoleWithCount);
  }

  /**
   * Check if role name exists for tenant
   */
  async nameExistsForTenant(name: string, tenantId: UUID, excludeId?: UUID): Promise<boolean> {
    const where: Record<string, unknown> = {
      name,
      tenantId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await db.role.count({ where });
    return count > 0;
  }

  /**
   * Check if role has users
   */
  async hasUsers(id: UUID): Promise<boolean> {
    const count = await db.user.count({
      where: { roleId: id },
    });
    return count > 0;
  }

  /**
   * Get user count for role
   */
  async getUserCount(id: UUID): Promise<number> {
    return db.user.count({
      where: { roleId: id },
    });
  }

  /**
   * Build search where clause
   */
  protected override buildSearchWhere(search: string): Record<string, unknown> {
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  /**
   * Map database result to Role type
   */
  private mapToRole(data: DbRoleWithCount): Role {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: data.permissions as RolePermissions,
      tenantId: data.tenantId,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      _count: data._count,
    };
  }

  /**
   * Map database result to RoleWithUsers type
   */
  private mapToRoleWithUsers(data: DbRoleFull): RoleWithUsers {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: data.permissions as RolePermissions,
      tenantId: data.tenantId,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      _count: data._count,
      users: data.users,
    };
  }
}

/**
 * Database types
 */
type DbRoleWithCount = {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
  };
};

type DbRoleFull = DbRoleWithCount & {
  users: readonly { id: string; email: string; name: string }[];
};

// Singleton instance
export const roleRepository = new RoleRepository();
