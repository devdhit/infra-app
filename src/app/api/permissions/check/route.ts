import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/api-utils'

// POST /api/permissions/check - Check if user has permission
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Safely parse request body
    let body;
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

    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission check request:', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRoleId: currentUser.role?.id,
        userRoleName: currentUser.role?.name,
        tenantId: currentUser.tenantId,
        resource,
        action
      });
    }

    // Use current user's role ID and tenant ID for security
    const roleId = currentUser.role?.id || '';
    const tenantId = currentUser.tenantId || '';

    // Check if user has permission
    const hasPerm = await hasPermission(roleId, tenantId, resource, action);
    
    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Permission check result:', {
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
      console.error('Error checking permissions:', error);
    }
    
    // Handle abort errors specifically
    if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
      return errorResponse('Request aborted', 499);
    }
    
    return errorResponse('Internal server error');
  }
}