import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { createHistoryRecord } from '@/lib/history'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger'

// POST /api/users/bulk-delete - Bulk delete users
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user has permission to bulk delete users
    const hasBulkDeletePermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'users',
      'bulkDelete'
    )

    if (!hasBulkDeletePermission) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { ids } = body

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid request: ids array is required', 400)
    }

    // Check if user is trying to delete themselves
    if (ids.includes(user.id)) {
      return errorResponse('You cannot delete your own account', 400)
    }

    // Fetch users to be deleted for history records
    const usersToDelete = await db.user.findMany({
      where: {
        id: {
          in: ids
        },
        tenantId: user.tenantId // Ensure users belong to the same tenant
      }
    })

    // Create history records for each user
    for (const userToDelete of usersToDelete) {
      await createHistoryRecord({
        action: 'delete',
        modelType: 'User',
        recordId: userToDelete.id,
        changes: userToDelete,
        userId: user.id,
        tenantId: user.tenantId
      })
    }

    // Perform bulk delete
    await db.user.deleteMany({
      where: {
        id: {
          in: ids
        },
        tenantId: user.tenantId // Ensure users belong to the same tenant
      }
    })

    return successResponse(null, 204)
  } catch (error: any) {
    logger.error('Error in bulk delete users route:', error)
    return errorResponse('Failed to delete users. Please try again later.')
  }
}