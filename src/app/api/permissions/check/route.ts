import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// Define the request body structure
interface PermissionCheckRequest {
  resource: string;
  action: string;
}

// Simple in-memory cache for permissions (in production, you might want to use Redis)
const permissionCache: Record<string, { hasPermission: boolean; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// POST /api/permissions/check - Check if user has permission
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Safely parse request body
    let body: PermissionCheckRequest | undefined;
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

    // Check if body is empty or undefined
    if (!body || Object.keys(body).length === 0) {
      return errorResponse('Missing request body', 400)
    }

    const { resource, action } = body

    // Validate input
    if (!resource || !action) {
      return errorResponse('Missing required parameters', 400)
    }

    // Use current user's role ID and tenant ID for security
    const roleId = currentUser.role?.id || '';
    const tenantId = currentUser.tenantId || '';

    // For admin users, all permissions are true
    if (currentUser.role?.name === 'admin') {
      return successResponse({ hasPermission: true });
    }

    // Create cache key
    const cacheKey = `${roleId}-${tenantId}-${resource}-${action}`;
    
    // Check if we have a cached result that's still valid
    const cachedResult = permissionCache[cacheKey];
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      // For debugging in development only
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Permission check result (from cache):', {
          roleId,
          tenantId,
          resource,
          action,
          hasPermission: cachedResult.hasPermission
        });
      }
      
      return successResponse({ hasPermission: cachedResult.hasPermission });
    }

    // Check if user has permission
    const hasPerm = await hasPermission(roleId, tenantId, resource, action);
    
    // Cache the result
    permissionCache[cacheKey] = {
      hasPermission: hasPerm,
      timestamp: Date.now()
    };
    
    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Permission check result:', {
        roleId,
        tenantId,
        resource,
        action,
        hasPermission: hasPerm
      });
    }

    return successResponse({ hasPermission: hasPerm });
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error checking permissions:', error);
    }
    
    // Handle abort errors specifically
    if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
      return errorResponse('Request aborted', 499);
    }
    
    return errorResponse('Internal server error');
  }
}

// Cleanup function to clear expired cache entries periodically
function cleanupCache() {
  const now = Date.now();
  for (const key in permissionCache) {
    const cachedItem = permissionCache[key];
    if (cachedItem && (now - cachedItem.timestamp) >= CACHE_TTL) {
      delete permissionCache[key];
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);