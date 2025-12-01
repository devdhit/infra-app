import { NextRequest } from 'next/server'
import { userService } from '@/lib/management/services/user.service'
import { checkPermission, apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/management/api-helpers'
import logger from '@/lib/logger'

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user: _user, error } = await checkPermission(request, 'users', 'view')
  if (error) return error

  try {
    const resolvedParams = await params;
    const result = await userService.getUserById(resolvedParams.id)
    
    if (!result.success) {
      return apiNotFound(result.error.message)
    }

    return apiSuccess(result.data)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error fetching user:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}

// PUT /api/users/[id] - Update a user (requires edit permission)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user: _user, error } = await checkPermission(request, 'users', 'edit')
  if (error) return error

  try {
    const resolvedParams = await params;
    const body = await request.json()
    const result = await userService.updateUser(resolvedParams.id, body)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(result.data)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error updating user:', error)
    }
    return apiBadRequest('Invalid request body')
  }
}

// DELETE /api/users/[id] - Delete a user (requires delete permission)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user: _user, error } = await checkPermission(request, 'users', 'delete')
  if (error) return error

  try {
    const resolvedParams = await params;
    const result = await userService.deleteUser(resolvedParams.id)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(null, 204)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error deleting user:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}