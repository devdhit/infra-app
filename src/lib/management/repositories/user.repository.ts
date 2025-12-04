/**
 * User repository
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';
import type {
  User,
  UserWithRole,
  UserWithDetails,
  UserFromDatabase,
  CreateUserData,
  UpdateUserData,
  UserFilterParams,
  UUID,
} from '@/types/management';

export class UserRepository extends BaseRepository<User> {
  protected readonly modelName = 'user';

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserFromDatabase | null> {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return this.mapToUserFromDatabase(user);
  }

  /**
   * Find user with role
   */
  async findByIdWithRole(id: UUID): Promise<UserWithRole | null> {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) return null;

    return this.mapToUserWithRole(user);
  }

  /**
   * Find user with full details
   */
  async findByIdWithDetails(id: UUID): Promise<UserWithDetails | null> {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) return null;

    return this.mapToUserWithDetails(user);
  }

  /**
   * Find users by tenant
   */
  async findByTenant(tenantId: UUID): Promise<readonly UserWithRole[]> {
    const users = await db.user.findMany({
      where: { tenantId },
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => this.mapToUserWithRole(u));
  }

  /**
   * Find users by role
   */
  async findByRole(roleId: UUID): Promise<readonly UserWithRole[]> {
    const users = await db.user.findMany({
      where: { roleId },
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => this.mapToUserWithRole(u));
  }

  /**
   * Find users by filter
   */
  async findByFilter(filter: UserFilterParams): Promise<readonly UserWithRole[]> {
    const where: Record<string, unknown> = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.roleId) {
      where.roleId = filter.roleId;
    }

    if (filter.tenantId) {
      where.tenantId = filter.tenantId;
    }

    if (filter.isLocked !== undefined) {
      if (filter.isLocked) {
        where.lockedUntil = { not: null };
      } else {
        where.lockedUntil = null;
      }
    }

    if (filter.createdAfter || filter.createdBefore) {
      where.createdAt = {};
      if (filter.createdAfter) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filter.createdAfter);
      }
      if (filter.createdBefore) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filter.createdBefore);
      }
    }

    const users = await db.user.findMany({
      where,
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => this.mapToUserWithRole(u));
  }

  /**
   * Create user
   */
  async createUser(data: CreateUserData & { password: string }): Promise<UserWithRole> {
    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        roleId: data.roleId ?? null,
        tenantId: data.tenantId || '',
      },
      include: {
        role: true,
      },
    });

    return this.mapToUserWithRole(user);
  }

  /**
   * Update user
   */
  async updateUser(id: UUID, data: UpdateUserData): Promise<UserWithRole> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.password !== undefined) {
      updateData.password = data.password;
    }
    if (data.roleId !== undefined) {
      updateData.roleId = data.roleId;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    return this.mapToUserWithRole(user);
  }

  /**
   * Update password
   */
  async updatePassword(id: UUID, hashedPassword: string): Promise<void> {
    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Lock user account
   * Note: Agent users should not be locked as they send automated requests every 6 hours.
   * The locking logic is handled in the service layer to check user role.
   */
  async lockUser(id: UUID, lockUntil: Date): Promise<void> {
    await db.user.update({
      where: { id },
      data: {
        lockedAt: new Date(),
        lockedUntil: lockUntil,
      },
    });
  }

  /**
   * Unlock user account
   */
  async unlockUser(id: UUID): Promise<void> {
    await db.user.update({
      where: { id },
      data: {
        lockedAt: null,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(id: UUID): Promise<number> {
    const user = await db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastLoginAttempt: new Date(),
      },
    });

    return user.failedLoginAttempts;
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(id: UUID): Promise<void> {
    await db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAttempt: new Date(),
      },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: UUID): Promise<boolean> {
    const where: Record<string, unknown> = { email };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await db.user.count({ where });
    return count > 0;
  }

  /**
   * Check if user is locked
   */
  async isLocked(id: UUID): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) return false;

    return new Date(user.lockedUntil) > new Date();
  }

  /**
   * Build search where clause
   */
  protected override buildSearchWhere(search: string): Record<string, unknown> {
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  /**
   * Map database result to User type
   */
  private mapToUser(data: DbUser): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      roleId: data.roleId,
      tenantId: data.tenantId,
      failedLoginAttempts: data.failedLoginAttempts,
      lockedAt: data.lockedAt ? data.lockedAt.toISOString() : null,
      lockedUntil: data.lockedUntil ? data.lockedUntil.toISOString() : null,
      lastLoginAttempt: data.lastLoginAttempt ? data.lastLoginAttempt.toISOString() : null,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }

  /**
   * Map database result to UserFromDatabase type
   */
  private mapToUserFromDatabase(data: DbUserFull): UserFromDatabase {
    return {
      ...this.mapToUser(data),
      password: data.password,
    };
  }

  /**
   * Map database result to UserWithRole type
   */
  private mapToUserWithRole(data: DbUserWithRole): UserWithRole {
    return {
      ...this.mapToUser(data),
      role: data.role ? {
        id: data.role.id,
        name: data.role.name,
        description: data.role.description,
        permissions: data.role.permissions as Record<string, readonly string[]>,
        tenantId: data.role.tenantId,
        createdAt: data.role.createdAt.toISOString(),
        updatedAt: data.role.updatedAt.toISOString(),
      } : null,
    };
  }

  /**
   * Map database result to UserWithDetails type
   */
  private mapToUserWithDetails(data: DbUserWithDetails): UserWithDetails {
    return {
      ...this.mapToUserWithRole(data),
      tenant: {
        id: data.tenant.id,
        name: data.tenant.name,
        description: data.tenant.description,
        createdAt: data.tenant.createdAt.toISOString(),
        updatedAt: data.tenant.updatedAt.toISOString(),
      },
    };
  }
}

/**
 * Database types
 */
type DbUser = {
  id: string;
  email: string;
  name: string;
  roleId: string | null;
  tenantId: string;
  failedLoginAttempts: number;
  lockedAt: Date | null;
  lockedUntil: Date | null;
  lastLoginAttempt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbUserFull = DbUser & {
  password: string;
};

type DbUserWithRole = DbUser & {
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: unknown;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

type DbUserWithDetails = DbUserWithRole & {
  tenant: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

// Singleton instance
export const userRepository = new UserRepository();
