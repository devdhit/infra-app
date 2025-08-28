// Define user roles
export type UserRole = 'admin' | 'user';

// Define permission actions
export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'bulkDelete';

// Define resource types
export type ResourceType = 
  | 'users'
  | 'tenants'
  | 'assets'
  | 'settings';

// Define permissions structure
interface Permission {
  role: UserRole;
  resource: ResourceType;
  actions: PermissionAction[];
}

// Define permissions for each role
const permissions: Permission[] = [
  {
    role: 'admin',
    resource: 'users',
    actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
  },
  {
    role: 'user',
    resource: 'users',
    actions: ['view'] // Regular users can only view their own profile
  },
  {
    role: 'admin',
    resource: 'tenants',
    actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
  },
  {
    role: 'user',
    resource: 'tenants',
    actions: ['view']
  },
  {
    role: 'admin',
    resource: 'assets',
    actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
  },
  {
    role: 'user',
    resource: 'assets',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    role: 'admin',
    resource: 'settings',
    actions: ['view', 'edit']
  },
  {
    role: 'user',
    resource: 'settings',
    actions: ['view']
  }
];

/**
 * Check if a user role has permission to perform an action on a resource
 * @param role - The user's role
 * @param resource - The resource type
 * @param action - The action to perform
 * @returns boolean - Whether the user has permission
 */
export function hasPermission(
  role: UserRole,
  resource: ResourceType,
  action: PermissionAction
): boolean {
  const permission = permissions.find(
    p => p.role === role && p.resource === resource
  );
  
  if (!permission) {
    return false;
  }
  
  return permission.actions.includes(action);
}

/**
 * Check if a user role has any of the specified permissions
 * @param role - The user's role
 * @param resource - The resource type
 * @param actions - Array of actions to check
 * @returns boolean - Whether the user has any of the permissions
 */
export function hasAnyPermission(
  role: UserRole,
  resource: ResourceType,
  actions: PermissionAction[]
): boolean {
  return actions.some(action => hasPermission(role, resource, action));
}

/**
 * Get all permissions for a user role
 * @param role - The user's role
 * @returns Array of permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return permissions.filter(p => p.role === role);
}