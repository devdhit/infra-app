// Only import and use PrismaClient and Redis on the server side
let db: any = null;
let redisCache: any = null;
let CACHE_PREFIXES: any = null;
let CACHE_TTL: any = null;

// Import logger for better error handling
let logger: any = null;
if (typeof window === 'undefined') {
  try {
    logger = require('./logger').default;
  } catch (error) {
    // Fallback to console if logger is not available
    logger = {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log
    };
  }
}

if (typeof window === 'undefined') {
  // Server-side only imports
  const dbModule = require('./db');
  db = dbModule.db;
  
  try {
    const redisModule = require('./redis-cache');
    redisCache = redisModule.default;
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
    CACHE_TTL = redisModule.CACHE_TTL;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'permissions', 
      error: error.message 
    });
  }
}

// Define permission actions with more flexible typing
export type PermissionAction = typeof COMMON_PERMISSION_ACTIONS[number] | string;

// Define resource types with more flexible typing
export type ResourceType = typeof COMMON_RESOURCE_TYPES[number] | string;

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
  'fixed-asset',
  'it-purchasing',
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

// Define default permissions for built-in roles with better type safety
const defaultPermissions: Record<string, Record<ResourceType, PermissionAction[]>> = {
  admin: {
    users: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    tenants: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    assets: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    settings: ['view', 'edit'],
    roles: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    pc: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    laptop: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    printer: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    license: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    warehouse: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    internet: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    'fixed-asset': ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    'it-purchasing': ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    auditLogs: ['view'],
    agent: ['submitData', 'viewStatus', 'healthCheck']
  },
  user: {
    users: ['view'],
    tenants: ['view'],
    assets: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    settings: ['view'],
    roles: ['view'],
    pc: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    laptop: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    printer: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    license: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    warehouse: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    internet: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    'fixed-asset': ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    'it-purchasing': ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    auditLogs: [], // Regular users cannot view audit logs by default
    agent: ['submitData', 'viewStatus', 'healthCheck']
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
  
  // Check if required modules are available
  if (!db) {
    logger.error('Database module not available', { component: 'permissions' });
    return false;
  }
  
  try {
    // Validate inputs
    if (!roleId || !tenantId || !resource || !action) {
      logger.warn('Invalid permission check parameters', { 
        component: 'permissions', 
        roleId, 
        tenantId, 
        resource, 
        action 
      });
      return false;
    }

    // Create cache key if Redis is available
    let cacheKey: string | null = null;
    if (redisCache && CACHE_PREFIXES) {
      cacheKey = redisCache.createKey(CACHE_PREFIXES.PERMISSIONS, roleId, tenantId);
    }
    
    // Check if we have a cached role that's still valid
    let role = null;
    if (redisCache && cacheKey) {
      const cachedRole = await redisCache.get(cacheKey);
      if (cachedRole) {
        role = cachedRole;
      }
    }
    
    if (!role) {
      // Get the role with its permissions
      role = await db.role.findUnique({
        where: {
          id: roleId,
          tenantId: tenantId
        }
      });
      
      // Cache the role with extended TTL if Redis is available
      if (redisCache && cacheKey && role) {
        // Increase cache TTL to 10 minutes for better performance
        await redisCache.set(cacheKey, role, CACHE_TTL ? CACHE_TTL.PERMISSIONS * 2 : 600);
      }
    }

    // Log permission check details
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Permission check details', { 
        component: 'permissions', 
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

    // For admin roles, all permissions are true
    if (role.name === 'admin') {
      return true;
    }

    // Get permissions directly from the role object
    const permissions: Record<ResourceType, PermissionAction[]> = role.permissions as Record<ResourceType, PermissionAction[]>;
    
    // Check if the role has the required permission
    if (permissions[resource] && permissions[resource].includes(action)) {
      return true;
    }

    // If no specific permission for this asset type, fall back to generic assets permission
    if (['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet', 'fixed-asset', 'it-purchasing'].includes(resource)) {
      if (permissions['assets'] && permissions['assets'].includes(action)) {
        return true;
      }
    }

    return false;
  } catch (error: any) {
    logger.error('Error checking permissions', { 
      component: 'permissions', 
      roleId, 
      tenantId, 
      resource, 
      action, 
      error: error.message, 
      stack: error.stack 
    });
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
          logger.warn('Invalid any permission check parameters:', { roleId, tenantId, resource, actions });
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
      logger.error('Error checking any permissions:', error);
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
        logger.warn('Invalid all permission check parameters:', { roleId, tenantId, resource, actions });
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
      logger.error('Error checking all permissions:', error);
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
    internet: [],
    'fixed-asset': [],
    auditLogs: [],
    agent: []
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
  
  // Check if required modules are available
  if (!db) {
    throw new Error('Database module not available');
  }
  
  try {
    const permissions = getDefaultPermissions(name);
    
    const role = await db.role.create({
      data: {
        name,
        description,
        permissions,
        tenantId
      }
    });
    
    // Invalidate cache for this tenant's roles if Redis is available
    if (redisCache) {
      await redisCache.delByPattern(`${CACHE_PREFIXES.PERMISSIONS}:*:${tenantId}`);
    }
    
    return role;
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creating role with default permissions:', error);
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

/**
 * Invalidate role cache for a specific tenant
 * @param tenantId - Tenant ID
 */
export async function invalidateTenantRoleCache(tenantId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    return;
  }
  
  // Check if Redis is available
  if (!redisCache) {
    return;
  }
  
  try {
    await redisCache.delByPattern(`${CACHE_PREFIXES.PERMISSIONS}:*:${tenantId}`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error invalidating tenant role cache:', error);
    }
  }
}

/**
 * Invalidate role cache for a specific role
 * @param roleId - Role ID
 * @param tenantId - Tenant ID
 */
export async function invalidateRoleCache(roleId: string, tenantId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    return;
  }
  
  // Check if Redis is available
  if (!redisCache || !CACHE_PREFIXES) {
    return;
  }
  
  try {
    const cacheKey = redisCache.createKey(CACHE_PREFIXES.PERMISSIONS, roleId, tenantId);
    await redisCache.del(cacheKey);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error invalidating role cache:', error);
    }
  }
}

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
        logger.error('Error in permissions cleanup:', error);
      }
    }
  }
}