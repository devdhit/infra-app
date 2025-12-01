/**
 * Tenant repository
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';
import type {
  Tenant,
  TenantWithDetails,
  CreateTenantData,
  UpdateTenantData,
  TenantFilterParams,
  UUID,
} from '@/types/management';

export class TenantRepository extends BaseRepository<Tenant> {
  protected readonly modelName = 'tenant';

  /**
   * Find tenant with counts
   */
  async findByIdWithCounts(id: UUID): Promise<Tenant | null> {
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
            fixedAssets: true,
            itPurchasings: true,
          },
        },
      },
    });

    if (!tenant) return null;

    return this.mapToTenant(tenant);
  }

  /**
   * Find tenant with full details
   */
  async findByIdWithDetails(id: UUID): Promise<TenantWithDetails | null> {
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
            fixedAssets: true,
            itPurchasings: true,
          },
        },
      },
    });

    if (!tenant) return null;

    return this.mapToTenantWithDetails(tenant);
  }

  /**
   * Find all tenants with counts
   */
  async findAllWithCounts(): Promise<readonly Tenant[]> {
    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
            fixedAssets: true,
            itPurchasings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map(t => this.mapToTenant(t));
  }

  /**
   * Find tenants by filter
   */
  async findByFilter(filter: TenantFilterParams): Promise<readonly Tenant[]> {
    const where: Record<string, unknown> = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
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

    const tenants = await db.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map(t => this.mapToTenant(t));
  }

  /**
   * Create tenant
   */
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    const tenant = await db.tenant.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      include: {
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
          },
        },
      },
    });

    return this.mapToTenant(tenant);
  }

  /**
   * Update tenant
   */
  async updateTenant(id: UUID, data: UpdateTenantData): Promise<Tenant> {
    const tenant = await db.tenant.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: {
            users: true,
            pcs: true,
            laptops: true,
            printers: true,
            licenses: true,
            warehouseITs: true,
            internets: true,
          },
        },
      },
    });

    return this.mapToTenant(tenant);
  }

  /**
   * Check if tenant has users
   */
  async hasUsers(id: UUID): Promise<boolean> {
    const count = await db.user.count({
      where: { tenantId: id },
    });
    return count > 0;
  }

  /**
   * Check if tenant has assets
   */
  async hasAssets(id: UUID): Promise<boolean> {
    const [pcCount, laptopCount, printerCount] = await Promise.all([
      db.pC.count({ where: { tenantId: id } }),
      db.laptop.count({ where: { tenantId: id } }),
      db.printer.count({ where: { tenantId: id } }),
    ]);
    return pcCount + laptopCount + printerCount > 0;
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
   * Map database result to Tenant type
   */
  private mapToTenant(data: DbTenantWithCounts): Tenant {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      _count: data._count,
    };
  }

  /**
   * Map database result to TenantWithDetails type
   */
  private mapToTenantWithDetails(data: DbTenantFull): TenantWithDetails {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      _count: data._count,
      users: data.users,
      roles: data.roles,
    };
  }
}

/**
 * Database types
 */
type DbTenantWithCounts = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    pcs: number;
    laptops: number;
    printers: number;
    licenses: number;
    warehouseITs: number;
    internets: number;
    fixedAssets?: number;
    itPurchasings?: number;
  };
};

type DbTenantFull = DbTenantWithCounts & {
  users: readonly { id: string; email: string; name: string }[];
  roles: readonly { id: string; name: string }[];
};

// Singleton instance
export const tenantRepository = new TenantRepository();
