import { NextRequest } from 'next/server';
import { getCurrentUser } from './auth';
import { hasPermission, ResourceType, PermissionAction } from './permissions';
import { unauthorizedResponse, errorResponse } from './api-utils';

/**
 * Permission middleware for API routes
 * Checks if the current user has permission to access a resource
 * @param request - The Next.js request object
 * @param resource - The resource type to check permissions for
 * @param action - The action to check permissions for
 * @returns Response object if permission is denied, null if permission is granted
 */
export async function checkPermission(
  request: NextRequest,
  resource: ResourceType,
  action: PermissionAction
): Promise<Response | null> {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Validate user has role and tenant
    if (!user.role?.id || !user.tenantId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('User missing role or tenant ID:', {
          userId: user.id,
          hasRole: !!user.role,
          hasRoleId: !!user.role?.id,
          hasTenantId: !!user.tenantId
        });
      }
      return errorResponse('User role or tenant information missing', 403);
    }
    
    // Check if user has permission
    const hasPerm = await hasPermission(
      user.role.id,
      user.tenantId,
      resource,
      action
    );
    
    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission middleware check:', {
        userId: user.id,
        userEmail: user.email,
        userRoleId: user.role.id,
        userRoleName: user.role.name,
        tenantId: user.tenantId,
        resource,
        action,
        hasPermission: hasPerm
      });
    }
    
    // Return forbidden response if no permission
    if (!hasPerm) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }
    
    // Permission granted
    return null;
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in permission middleware:', error);
    }
    
    // Return internal server error for unexpected issues
    return errorResponse('Internal server error during permission check');
  }
}

/**
 * Permission middleware for API routes that checks multiple permissions
 * Grants access if user has any of the specified permissions
 * @param request - The Next.js request object
 * @param resource - The resource type to check permissions for
 * @param actions - Array of actions to check permissions for
 * @returns Response object if permission is denied, null if permission is granted
 */
export async function checkAnyPermission(
  request: NextRequest,
  resource: ResourceType,
  actions: PermissionAction[]
): Promise<Response | null> {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Validate user has role and tenant
    if (!user.role?.id || !user.tenantId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('User missing role or tenant ID:', {
          userId: user.id,
          hasRole: !!user.role,
          hasRoleId: !!user.role?.id,
          hasTenantId: !!user.tenantId
        });
      }
      return errorResponse('User role or tenant information missing', 403);
    }
    
    // Check if user has any of the specified permissions
    for (const action of actions) {
      const hasPerm = await hasPermission(
        user.role.id,
        user.tenantId,
        resource,
        action
      );
      
      // For debugging in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('Permission middleware check (any):', {
          userId: user.id,
          userEmail: user.email,
          userRoleId: user.role.id,
          userRoleName: user.role.name,
          tenantId: user.tenantId,
          resource,
          action,
          hasPermission: hasPerm
        });
      }
      
      // If any permission is granted, allow access
      if (hasPerm) {
        return null;
      }
    }
    
    // If no permissions were granted, return forbidden
    return errorResponse('Forbidden: Insufficient permissions', 403);
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in permission middleware:', error);
    }
    
    // Return internal server error for unexpected issues
    return errorResponse('Internal server error during permission check');
  }
}