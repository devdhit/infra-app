import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to view users
    const hasViewPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'view'
    )

    if (!hasViewPermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get role name from the related Role object, default to 'user'
    const currentRoleName = currentUser.role?.name || 'user';

    const user = await db.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return notFoundResponse('User not found')
    }

    // Check if user belongs to the same tenant (unless admin)
    if (currentRoleName !== 'admin' && currentUser.tenantId !== user.tenantId) {
      return errorResponse('Forbidden', 403)
    }

    return successResponse(user)
  } catch (error) {
    logger.error('Error fetching user:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/users/[id] - Update a user (requires edit permission)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to edit users
    const hasEditPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'edit'
    )

    if (!hasEditPermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get role name from the related Role object, default to 'user'
    const currentRoleName = currentUser.role?.name || 'user';

    const body = await request.json()
    
    // Validate input
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse('Invalid email format', 400)
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingUser) {
      return notFoundResponse('User not found')
    }

    // Check permissions
    if (currentRoleName !== 'admin' && currentUser.tenantId !== existingUser.tenantId) {
      return errorResponse('Forbidden', 403)
    }

    // Prevent non-admins from changing user role or tenant
    const updateData: any = {
      name: body.name,
      email: body.email
    }

    // Validate role if provided
    if (body.role) {
      if (currentRoleName === 'admin') {
        // Find the role by name within the same tenant
        const role = await db.role.findFirst({
          where: {
            name: body.role,
            tenantId: currentUser.tenantId
          }
        })

        if (!role) {
          return errorResponse('Role not found', 400)
        }

        updateData.roleId = role.id
      }
      // For non-admin users, we don't allow role changes, so we skip this
    }

    if (currentRoleName === 'admin' && body.tenantId !== undefined) {
      updateData.tenantId = body.tenantId
    }

    // Hash password if provided
    if (body.password) {
      if (body.password.length < 6) {
        return errorResponse('Password must be at least 6 characters long', 400)
      }
      updateData.password = await hashPassword(body.password)
    }

    const user = await db.user.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        role: true
      }
    })

    // Remove password from response
    const { password, roleId, ...userWithoutPassword } = user
    const userWithRole = {
      ...userWithoutPassword,
      role: user.role
    }

    return successResponse(userWithRole)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('User not found')
    }
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return errorResponse('User with this email already exists', 400)
    }
    
    logger.error('Error updating user:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/users/[id] - Delete a user (requires delete permission)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to delete users
    const hasDeletePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'delete'
    )

    if (!hasDeletePermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get role name from the related Role object, default to 'user'
    const currentRoleName = currentUser.role?.name || 'user';

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingUser) {
      return notFoundResponse('User not found')
    }

    // Check permissions
    if (currentRoleName !== 'admin' && currentUser.tenantId !== existingUser.tenantId) {
      return errorResponse('Forbidden', 403)
    }

    // Prevent users from deleting themselves
    if (currentUser.id === resolvedParams.id) {
      return errorResponse('Cannot delete yourself', 400)
    }

    await db.user.delete({
      where: { id: resolvedParams.id }
    })

    return successResponse(null, 204)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('User not found')
    }
    
    logger.error('Error deleting user:', error)
    return errorResponse('Internal server error')
  }
}