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

// POST /api/permissions/batch - Check multiple permissions in a single request
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Safely parse request body
    let body: { permissions: PermissionCheck[] } | undefined;
    try {
      const text = await request.text();
      
      // Check if body is empty
      if (!text || text.trim() === '') {
        return errorResponse('Missing request body', 400)
      }
      
      body = JSON.parse(text)
    } catch (parseError: any) {
      // Check if it's an abort error
      if (parseError.name === 'AbortError' || parseError.code === 'ECONNRESET') {
        return errorResponse('Request aborted', 499)
      }
      
      return errorResponse('Invalid JSON in request body', 400)
    }

    // Validate input
    if (!body || !Array.isArray(body.permissions)) {
      return errorResponse('Missing or invalid permissions array', 400)
    }

    const permissionsToCheck: PermissionCheck[] = body.permissions;
    
    // Validate each permission object
    for (const perm of permissionsToCheck) {
      if (!perm.resource || !perm.action) {
        return errorResponse('Each permission must have resource and action properties', 400)
      }
    }

    // Use current user's role ID and tenant ID for security
    const roleId = currentUser.role?.id || '';
    const tenantId = currentUser.tenantId || '';

    // For admin users, all permissions are true
    if (currentUser.role?.name === 'admin') {
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

    // Check all permissions in parallel with a reasonable concurrency limit
    const CONCURRENCY_LIMIT = 5;
    const results: Record<string, boolean> = {};
    
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
        } catch (error) {
          // Log errors only in development
          if (process.env.NODE_ENV === 'development') {
            logger.error(`Error checking permission ${perm.resource}:${perm.action}:`, error);
          }
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
      
      // Add a small delay between chunks to avoid overwhelming the database
      if (i + CONCURRENCY_LIMIT < uniquePermissions.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return successResponse({ permissions: results });
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error checking batch permissions:', error);
    }
    
    // Handle abort errors specifically
    if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
      return errorResponse('Request aborted', 499);
    }
    
    return errorResponse('Internal server error');
  }
}