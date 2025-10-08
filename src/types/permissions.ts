// Define permission-related interfaces and types
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'bulkDelete' | 'submitData' | 'viewStatus' | 'healthCheck' | string;

export type ResourceType = 'users' | 'tenants' | 'assets' | 'settings' | 'roles' | 'pc' | 'laptop' | 'printer' | 'license' | 'warehouse' | 'internet' | 'auditLogs' | 'agent' | string;

// Define common resource types for better type safety
export const COMMON_RESOURCE_TYPES = [
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
  'auditLogs',
  'agent'
] as const;

// Define common permission actions for better type safety
export const COMMON_PERMISSION_ACTIONS = [
  'view', 
  'create', 
  'edit', 
  'delete', 
  'bulkDelete',
  'submitData',
  'viewStatus',
  'healthCheck'
] as const;

// Define the structure for role permissions
export interface RolePermissions {
  [resource: string]: PermissionAction[];
}

// Define the structure for a role
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Define the structure for default permissions for built-in roles
export interface DefaultPermissions {
  admin: RolePermissions;
  user: RolePermissions;
  [roleName: string]: RolePermissions;
}