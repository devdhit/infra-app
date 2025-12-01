import { NextRequest } from 'next/server'
import { roleService } from '@/lib/management/services/role.service'
import { checkPermission, apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/management/api-helpers'
import logger from '@/lib/logger';

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: _user, error } = await checkPermission(request, 'roles', 'view')
  if (error) return error

  try {
    const result = await roleService.getRoleWithUsers(params.id)
    
    if (!result.success) {
      return apiNotFound(result.error.message)
    }

    return apiSuccess(result.data)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error fetching role:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: _user, error } = await checkPermission(request, 'roles', 'edit')
  if (error) return error

  try {
    const body = await request.json()
    const result = await roleService.updateRole(params.id, body)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(result.data)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error updating role:', error)
    }
    return apiBadRequest('Invalid request body')
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: _user, error } = await checkPermission(request, 'roles', 'delete')
  if (error) return error

  try {
    const result = await roleService.deleteRole(params.id)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(null, 204)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error deleting role:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}