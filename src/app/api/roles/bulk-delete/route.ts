import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'

// POST /api/roles/bulk-delete - Bulk delete roles
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Check if user has permission to bulk delete roles
    const hasBulkDeletePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'bulkDelete'
    )
    
    if (!hasBulkDeletePermission) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { ids } = body

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Role IDs are required', 400)
    }

    // Check if any roles are assigned to users
    const usersWithRoles = await db.user.findMany({
      where: {
        roleId: {
          in: ids
        }
      }
    })

    if (usersWithRoles.length > 0) {
      return errorResponse('Cannot delete roles that are assigned to users', 400)
    }

    // Delete the roles
    await db.role.deleteMany({
      where: {
        id: {
          in: ids
        },
        tenantId: currentUser.tenantId
      }
    })

    return successResponse({ message: 'Roles deleted successfully' }, 200)
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error bulk deleting roles:', error)
    }
    return errorResponse('Internal server error')
  }
}