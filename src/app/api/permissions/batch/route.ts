import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// Define the permission check structure
interface PermissionCheck {
  resource: string;
  action: string;
}

// Generate a unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// POST /api/permissions/batch - Check multiple permissions in a single request
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      logger.warn('Unauthorized permission check attempt', { requestId, component: 'permissions-batch' });
      return errorResponse('Unauthorized', 401, { requestId });
    }

    // Log request details
    logger.debug('Processing batch permissions request', { 
      requestId, 
      userId: currentUser.id, 
      tenantId: currentUser.tenantId, 
      component: 'permissions-batch' 
    });
    
    // Safely parse request body
    let body: { permissions: PermissionCheck[] } | undefined;
    try {
      const text = await request.text();
      
      // Check if body is empty
      if (!text || text.trim() === '') {
        logger.warn('Missing request body in permissions check', { 
          requestId, 
          userId: currentUser.id, 
          component: 'permissions-batch' 
        });
        return errorResponse('Missing request body', 400, { requestId });
      }
      
      body = JSON.parse(text);
    } catch (parseError: any) {
      // Check if it's an abort error
      if (parseError.name === 'AbortError' || parseError.code === 'ECONNRESET') {
        logger.warn('Request aborted during permissions check', { 
          requestId, 
          userId: currentUser.id, 
          component: 'permissions-batch' 
        });
        return errorResponse('Request aborted', 499, { requestId });
      }
      
      logger.error('Invalid JSON in permissions request body', { 
        requestId, 
        userId: currentUser.id, 
        error: parseError.message, 
        component: 'permissions-batch' 
      });
      return errorResponse('Invalid JSON in request body', 400, { requestId });
    }

    // Validate input
    if (!body || !Array.isArray(body.permissions)) {
      logger.warn('Missing or invalid permissions array in request', { 
        requestId, 
        userId: currentUser.id, 
        component: 'permissions-batch' 
      });
      return errorResponse('Missing or invalid permissions array', 400, { requestId });
    }

    const permissionsToCheck: PermissionCheck[] = body.permissions;
    
    // Validate each permission object
    for (const perm of permissionsToCheck) {
      if (!perm.resource || !perm.action) {
        logger.warn('Invalid permission object - missing resource or action', { 
          requestId, 
          userId: currentUser.id, 
          permission: perm, 
          component: 'permissions-batch' 
        });
        return errorResponse('Each permission must have resource and action properties', 400, { requestId });
      }
    }

    // Use current user's role ID and tenant ID for security
    const roleId = currentUser.role?.id || '';
    const tenantId = currentUser.tenantId || '';

    // Log admin user shortcut
    if (currentUser.role?.name === 'admin') {
      logger.debug('Admin user - granting all permissions', { 
        requestId, 
        userId: currentUser.id, 
        tenantId, 
        component: 'permissions-batch' 
      });
      const results: Record<string, boolean> = {};
      for (const perm of permissionsToCheck) {
        const key = `${perm.resource}:${perm.action}`;
        results[key] = true;
      }
      return successResponse({ permissions: results });
    }

    // Remove duplicates from permissions to check
    const uniquePermissions = Array.from(
      new Map(
        permissionsToCheck.map(perm => [`${perm.resource}:${perm.action}`, perm])
      ).values()
    );

    logger.debug('Checking permissions', { 
      requestId, 
      userId: currentUser.id, 
      tenantId, 
      permissionCount: uniquePermissions.length, 
      component: 'permissions-batch' 
    });

    // Check all permissions in parallel with an increased concurrency limit
    const CONCURRENCY_LIMIT = 10; // Increased from 5 to 10
    const results: Record<string, boolean> = {};
    let errorCount = 0;
    
    // Process permissions in chunks to avoid overwhelming the database
    for (let i = 0; i < uniquePermissions.length; i += CONCURRENCY_LIMIT) {
      const chunk = uniquePermissions.slice(i, i + CONCURRENCY_LIMIT);
      
      const permissionChecks = chunk.map(async (perm) => {
        try {
          const hasPerm = await hasPermission(roleId, tenantId, perm.resource, perm.action);
          return {
            key: `${perm.resource}:${perm.action}`,
            value: hasPerm
          };
        } catch (error: any) {
          errorCount++;
          logger.error(`Error checking permission ${perm.resource}:${perm.action}`, { 
            requestId, 
            userId: currentUser.id, 
            tenantId, 
            error: error.message, 
            stack: error.stack, 
            component: 'permissions-batch' 
          });
          return {
            key: `${perm.resource}:${perm.action}`,
            value: false
          };
        }
      });

      const chunkResults = await Promise.all(permissionChecks);
      
      // Add results to the main results object
      for (const result of chunkResults) {
        results[result.key] = result.value;
      }
      
      // Reduce delay between chunks to 5ms for better performance
      if (i + CONCURRENCY_LIMIT < uniquePermissions.length) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }

    // Log completion
    logger.debug('Permissions check completed', { 
      requestId, 
      userId: currentUser.id, 
      tenantId, 
      permissionCount: uniquePermissions.length, 
      errorCount, 
      component: 'permissions-batch' 
    });

    return successResponse({ permissions: results });
  } catch (error: any) {
    logger.error('Unexpected error checking batch permissions', { 
      requestId, 
      error: error.message, 
      stack: error.stack, 
      component: 'permissions-batch' 
    });
    
    // Handle abort errors specifically
    if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
      return errorResponse('Request aborted', 499, { requestId });
    }
    
    return errorResponse('Internal server error', 500, { requestId });
  }
}