// Only import and use PrismaClient on the server side
import { db } from './db';

// Simple in-memory cache for role permissions (in production, you might want to use Redis)
const roleCache: Record<string, { role: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Define permission actions with more flexible typing
export type PermissionAction = string;

// Define resource types with more flexible typing
export type ResourceType = string;

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
  'internet'
] as const;

// Define common permission actions for better type safety
export const COMMON_PERMISSION_ACTIONS = [
  'view', 
  'create', 
  'edit', 
  'delete', 
  'bulkDelete'
] as const;

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
    roles: ['view'], // Regular users can view roles
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
  if (typeof window !== 'undefined') {
    return false;
  }
  
  try {
    // Validate inputs
    if (!roleId || !tenantId || !resource || !action) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid permission check parameters:', { roleId, tenantId, resource, action });
      }
      return false;
    }

    // Create cache key
    const cacheKey = `${roleId}-${tenantId}`;
    
    // Check if we have a cached role that's still valid
    let role = null;
    const cachedRole = roleCache[cacheKey];
    if (cachedRole && (Date.now() - cachedRole.timestamp) < CACHE_TTL) {
      role = cachedRole.role;
    } else {
      // Get the role with its permissions
      role = await db.role.findUnique({
        where: {
          id: roleId,
          tenantId: tenantId
        }
      });
      
      // Cache the role
      if (role) {
        roleCache[cacheKey] = {
          role,
          timestamp: Date.now()
        };
      }
    }

    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission check details:', {
        roleId,
        tenantId,
        resource,
        action,
        roleFound: !!role,
        roleName: role?.name,
        rolePermissions: role?.permissions
      });
    }

    if (!role) {
      return false;
    }

    // Get permissions directly from the role object
    const permissions: Record<ResourceType, PermissionAction[]> = role.permissions as Record<ResourceType, PermissionAction[]>;
    
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
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking permissions:', error);
    }
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
  if (typeof window !== 'undefined') {
    return false;
  }
  
  try {
    // Validate inputs
    if (!roleId || !tenantId || !resource || !actions || !Array.isArray(actions)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid any permission check parameters:', { roleId, tenantId, resource, actions });
      }
      return false;
    }

    for (const action of actions) {
      if (await hasPermission(roleId, tenantId, resource, action)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking any permissions:', error);
    }
    return false;
  }
}

/**
 * Check if a user role has all of the specified permissions
 * @param roleId - The user's role ID
 * @param tenantId - The user's tenant ID
 * @param resource - The resource type
 * @param actions - Array of actions to check
 * @returns boolean - Whether the user has all of the permissions
 */
export async function hasAllPermissions(
  roleId: string,
  tenantId: string,
  resource: ResourceType,
  actions: PermissionAction[]
): Promise<boolean> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    return false;
  }
  
  try {
    // Validate inputs
    if (!roleId || !tenantId || !resource || !actions || !Array.isArray(actions)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid all permission check parameters:', { roleId, tenantId, resource, actions });
      }
      return false;
    }

    for (const action of actions) {
      if (!(await hasPermission(roleId, tenantId, resource, action))) {
        return false;
      }
    }
    return true;
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking all permissions:', error);
    }
    return false;
  }
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
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
  
  try {
    const permissions = getDefaultPermissions(name);
    
    return await db.role.create({
      data: {
        name,
        description,
        permissions,
        tenantId
      }
    });
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating role with default permissions:', error);
    }
    throw error;
  }
}

/**
 * Merge permissions from source into target, overriding existing permissions
 * @param target - Target permissions object
 * @param source - Source permissions object
 * @returns Merged permissions object
 */
export function mergePermissions(
  target: Record<ResourceType, PermissionAction[]>,
  source: Record<ResourceType, PermissionAction[]>
): Record<ResourceType, PermissionAction[]> {
  const result = { ...target };
  
  for (const [resource, actions] of Object.entries(source)) {
    result[resource] = [...actions];
  }
  
  return result;
}

/**
 * Add permissions to existing permissions object
 * @param permissions - Existing permissions object
 * @param resource - Resource type
 * @param actions - Actions to add
 * @returns Updated permissions object
 */
export function addPermissions(
  permissions: Record<ResourceType, PermissionAction[]>,
  resource: ResourceType,
  actions: PermissionAction[]
): Record<ResourceType, PermissionAction[]> {
  const result = { ...permissions };
  const existingActions = result[resource] || [];
  
  // Add only new actions that don't already exist
  const newActions = actions.filter(action => !existingActions.includes(action));
  result[resource] = [...existingActions, ...newActions];
  
  return result;
}

/**
 * Remove permissions from existing permissions object
 * @param permissions - Existing permissions object
 * @param resource - Resource type
 * @param actions - Actions to remove
 * @returns Updated permissions object
 */
export function removePermissions(
  permissions: Record<ResourceType, PermissionAction[]>,
  resource: ResourceType,
  actions: PermissionAction[]
): Record<ResourceType, PermissionAction[]> {
  const result = { ...permissions };
  const existingActions = result[resource] || [];
  
  // Remove specified actions
  result[resource] = existingActions.filter(action => !actions.includes(action));
  
  return result;
}

// Cleanup function to clear expired cache entries periodically
function cleanupRoleCache() {
  const now = Date.now();
  for (const key in roleCache) {
    const cachedItem = roleCache[key];
    if (cachedItem && (now - cachedItem.timestamp) >= CACHE_TTL) {
      delete roleCache[key];
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cleanupRoleCache, 10 * 60 * 1000);

// Cleanup function to disconnect the database when needed
export async function cleanupPermissions() {
  if (typeof window === 'undefined') {
    // Server-side only
    try {
      // Don't disconnect the shared db instance here as it's managed in db.ts
      // This prevents connection churn which can lead to "too many clients" errors
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in permissions cleanup:', error);
      }
    }
  }
}