import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// POST /api/users/[id]/unlock - Unlock a user account (requires admin permission)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Check if user has permission to manage users
    const hasManageUsersPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'manage'
    )

    if (!hasManageUsersPermission) {
      return errorResponse('Forbidden', 403)
    }

    const userId = params.id

    // Find the user to unlock
    const userToUnlock = await db.user.findUnique({
      where: { id: userId }
    })

    if (!userToUnlock) {
      return errorResponse('User not found', 404)
    }

    // Check if user belongs to the same tenant (unless current user is admin)
    const currentRoleName = currentUser.role?.name || 'user'
    if (currentRoleName !== 'admin' && userToUnlock.tenantId !== currentUser.tenantId) {
      return errorResponse('Forbidden', 403)
    }

    // Unlock the user account
    const unlockedUser = await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lockedUntil: null
      }
    })

    logger.info('User account unlocked', { 
      unlockedUserId: userId, 
      unlockedByEmail: currentUser.email,
      unlockedByUserId: currentUser.id
    })

    return successResponse({
      message: 'User account unlocked successfully',
      user: {
        id: unlockedUser.id,
        email: unlockedUser.email,
        name: unlockedUser.name
      }
    })
  } catch (error: any) {
    logger.error('Error unlocking user:', error)
    return errorResponse('Internal server error')
  }
}