/**
 * Role and Permission type definitions
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { BaseEntity, UUID } from './common';

/**
 * Resource types in the system
 */
export const RESOURCE_TYPES = [
  'users',
  'tenants',
  'assets',
  'settings',
  'roles',
  'pc',
  'laptop',
  'printer',
  'license',
  'warehouse',
  'internet',
  'fixed-asset',
  'it-purchasing',
  'auditLogs',
  'agent',
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

/**
 * Permission actions
 */
export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'bulkDelete',
  'submitData',
  'viewStatus',
  'healthCheck',
] as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[number];

/**
 * Permissions map for a role
 */
export type RolePermissions = Readonly<Partial<Record<ResourceType, readonly PermissionAction[]>>>;

/**
 * Role entity from database
 */
export interface Role extends BaseEntity {
  readonly name: string;
  readonly description: string | null;
  readonly permissions: RolePermissions;
  readonly tenantId: UUID;
  readonly _count?: {
    readonly users: number;
  };
}

/**
 * Role with user details
 */
export interface RoleWithUsers extends Role {
  readonly users: readonly {
    readonly id: UUID;
    readonly email: string;
    readonly name: string;
  }[];
}

/**
 * Create role request data
 */
export interface CreateRoleData {
  readonly name: string;
  readonly description?: string | null;
  readonly permissions: RolePermissions;
}

/**
 * Update role request data
 */
export interface UpdateRoleData {
  readonly name?: string;
  readonly description?: string | null;
  readonly permissions?: RolePermissions;
}

/**
 * Permission check params
 */
export interface PermissionCheckParams {
  readonly roleId: UUID;
  readonly tenantId: UUID;
  readonly resource: ResourceType;
  readonly action: PermissionAction;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  readonly hasPermission: boolean;
  readonly reason?: string;
}

/**
 * Default permissions for built-in roles
 */
export interface DefaultRolePermissions {
  readonly admin: RolePermissions;
  readonly user: RolePermissions;
}

/**
 * Role assignment
 */
export interface RoleAssignment {
  readonly userId: UUID;
  readonly roleId: UUID;
  readonly assignedAt: string;
  readonly assignedBy?: UUID;
}

/**
 * Permission matrix for display
 */
export interface PermissionMatrix {
  readonly resource: ResourceType;
  readonly actions: {
    readonly action: PermissionAction;
    readonly enabled: boolean;
  }[];
}

/**
 * Role validation result
 */
export interface RoleValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly {
    readonly field: string;
    readonly message: string;
  }[];
}
