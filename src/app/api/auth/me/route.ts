import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

// GET /api/auth/me - Get current user information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return errorResponse('Unauthorized', 401, { quiet: true });
    }

    // Return user information without sensitive data
    // Note: User type doesn't include password field, so no need to exclude it
    const userWithoutSensitiveData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions: user.role.permissions,
        tenantId: user.role.tenantId,
        createdAt: user.role.createdAt,
        updatedAt: user.role.updatedAt
      } : null,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return successResponse(userWithoutSensitiveData);
  } catch (error) {
    console.error('Error fetching user data:', error)
    return errorResponse('Internal server error');
  }
}