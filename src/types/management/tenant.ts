/**
 * Tenant type definitions
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { BaseEntity, UUID, ISODateString } from './common';

/**
 * Tenant entity from database
 */
export interface Tenant extends BaseEntity {
  readonly name: string;
  readonly description: string | null;
  readonly _count?: TenantCounts;
}

/**
 * Tenant resource counts
 */
export interface TenantCounts {
  readonly users: number;
  readonly pcs: number;
  readonly laptops: number;
  readonly printers: number;
  readonly licenses: number;
  readonly warehouseITs: number;
  readonly internets: number;
  readonly fixedAssets?: number;
  readonly itPurchasings?: number;
}

/**
 * Tenant with full details including relationships
 */
export interface TenantWithDetails extends Tenant {
  readonly users?: readonly {
    readonly id: UUID;
    readonly email: string;
    readonly name: string;
  }[];
  readonly roles?: readonly {
    readonly id: UUID;
    readonly name: string;
  }[];
}

/**
 * Create tenant request data
 */
export interface CreateTenantData {
  readonly name: string;
  readonly description?: string | null;
}

/**
 * Update tenant request data
 */
export interface UpdateTenantData {
  readonly name?: string;
  readonly description?: string | null;
}

/**
 * Tenant filter params
 */
export interface TenantFilterParams {
  readonly search?: string;
  readonly hasUsers?: boolean;
  readonly createdAfter?: ISODateString;
  readonly createdBefore?: ISODateString;
}

/**
 * Tenant list item (for tables and lists)
 */
export interface TenantListItem extends Tenant {
  readonly userCount: number;
  readonly assetCount: number;
  readonly lastActivity?: ISODateString;
}

/**
 * Tenant deletion result
 */
export interface TenantDeletionResult {
  readonly deletedTenantId: UUID;
  readonly deletedUserCount: number;
  readonly deletedAssetCount: number;
}

/**
 * Tenant statistics
 */
export interface TenantStatistics {
  readonly tenantId: UUID;
  readonly totalUsers: number;
  readonly totalAssets: number;
  readonly assetBreakdown: TenantCounts;
  readonly activeUsers: number;
  readonly createdAt: ISODateString;
}
