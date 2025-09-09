import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/api-utils'

// GET /api/test/permissions - Test endpoint to verify permission checking
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Test a few permissions
    const testPermissions = [
      { resource: 'pc', action: 'view' },
      { resource: 'users', action: 'view' },
      { resource: 'settings', action: 'view' }
    ];

    const results: Record<string, boolean> = {};
    
    for (const perm of testPermissions) {
      try {
        const hasPerm = await hasPermission(
          currentUser.role?.id || '',
          currentUser.tenantId,
          perm.resource,
          perm.action
        );
        results[`${perm.resource}:${perm.action}`] = hasPerm;
      } catch (error) {
        console.error(`Error checking permission ${perm.resource}:${perm.action}:`, error);
        results[`${perm.resource}:${perm.action}`] = false;
      }
    }

    return successResponse({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role?.name || 'user'
      },
      permissions: results
    });
  } catch (error: any) {
    console.error('Error in test permissions route:', error);
    return errorResponse('Internal server error');
  }
}