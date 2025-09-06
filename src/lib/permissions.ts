// Only import and use PrismaClient on the server side
let db: any;

if (typeof window === 'undefined') {
  // Server-side only
  const { db: serverDb } = require('@/lib/db');
  db = serverDb;
}

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
  | 'settings'
  | 'roles'
  | 'pc'
  | 'laptop'
  | 'printer'
  | 'license'
  | 'warehouse'
  | 'internet';

// Define default permissions for built-in roles
const defaultPermissions: Record<string, Record<ResourceType, PermissionAction[]>> = {
  admin: {
    users: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    tenants: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    assets: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    settings: ['view', 'edit'],
    roles: ['view', 'create', 'edit', 'delete'],
    pc: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    laptop: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    printer: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    license: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    warehouse: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    internet: ['view', 'create', 'edit', 'delete', 'bulkDelete']
  },
  user: {
    users: ['view'], // Regular users can only view their own profile
    tenants: ['view'],
    assets: ['view', 'create', 'edit', 'delete'],
    settings: ['view'],
    roles: [], // Regular users cannot manage roles
    pc: ['view', 'create', 'edit', 'delete'],
    laptop: ['view', 'create', 'edit', 'delete'],
    printer: ['view', 'create', 'edit', 'delete'],
    license: ['view', 'create', 'edit', 'delete'],
    warehouse: ['view', 'create', 'edit', 'delete'],
    internet: ['view', 'create', 'edit', 'delete']
  }
};

/**
 * Check if a user role has permission to perform an action on a resource
 * @param roleId - The user's role ID
 * @param tenantId - The user's tenant ID
 * @param resource - The resource type
 * @param action - The action to perform
 * @returns boolean - Whether the user has permission
 */
export async function hasPermission(
  roleId: string,
  tenantId: string,
  resource: ResourceType,
  action: PermissionAction
): Promise<boolean> {
  // Prevent running on the browser
  if (typeof window !== 'undefined' || !db) {
    return false;
  }
  
  try {
    // Get the role with its permissions
    const role = await db.role.findUnique({
      where: {
        id: roleId,
        tenantId: tenantId
      }
    });

    if (!role) {
      return false;
    }

    // Parse permissions from JSON
    const permissions = role.permissions as Record<ResourceType, PermissionAction[]>;
    
    // Check if the role has the required permission
    if (permissions[resource] && permissions[resource].includes(action)) {
      return true;
    }

    // If no specific permission for this asset type, fall back to generic assets permission
    if (['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet'].includes(resource)) {
      if (permissions['assets'] && permissions['assets'].includes(action)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if a user role has any of the specified permissions
 * @param roleId - The user's role ID
 * @param tenantId - The user's tenant ID
 * @param resource - The resource type
 * @param actions - Array of actions to check
 * @returns boolean - Whether the user has any of the permissions
 */
export async function hasAnyPermission(
  roleId: string,
  tenantId: string,
  resource: ResourceType,
  actions: PermissionAction[]
): Promise<boolean> {
  // Prevent running on the browser
  if (typeof window !== 'undefined' || !db) {
    return false;
  }
  
  for (const action of actions) {
    if (await hasPermission(roleId, tenantId, resource, action)) {
      return true;
    }
  }
  return false;
}

/**
 * Get default permissions for a role name
 * @param roleName - The role name
 * @returns Object with default permissions
 */
export function getDefaultPermissions(roleName: string): Record<ResourceType, PermissionAction[]> {
  return defaultPermissions[roleName] || {
    users: [],
    tenants: [],
    assets: [],
    settings: [],
    roles: [],
    pc: [],
    laptop: [],
    printer: [],
    license: [],
    warehouse: [],
    internet: []
  };
}

/**
 * Create a new role with default permissions
 * @param name - Role name
 * @param tenantId - Tenant ID
 * @param description - Role description
 * @returns Promise with created role
 */
export async function createRoleWithDefaultPermissions(
  name: string,
  tenantId: string,
  description: string = ''
) {
  // Prevent running on the browser
  if (typeof window !== 'undefined' || !db) {
    throw new Error('This function can only be called on the server side');
  }
  
  const permissions = getDefaultPermissions(name);
  
  return await db.role.create({
    data: {
      name,
      description,
      permissions,
      tenantId
    }
  });
}