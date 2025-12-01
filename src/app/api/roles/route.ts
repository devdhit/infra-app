import { NextRequest } from 'next/server'
import { roleService } from '@/lib/management/services/role.service'
import { checkPermission, apiSuccess, apiError, apiBadRequest } from '@/lib/management/api-helpers'
import logger from '@/lib/logger';

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  const { user, error } = await checkPermission(request, 'roles', 'view')
  if (error) return error

  try {
    const result = await roleService.getTenantRoles(user!.tenantId)
    
    if (!result.success) {
      return apiError(result.error.message, 'INTERNAL_ERROR')
    }

    return apiSuccess({
      data: result.data,
      pagination: {
        page: 1,
        limit: result.data.length,
        total: result.data.length,
        totalPages: 1,
      },
    })
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error fetching roles:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  const { user, error } = await checkPermission(request, 'roles', 'create')
  if (error) return error

  try {
    const body = await request.json()
    const result = await roleService.createRole(body, user!.tenantId)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(result.data, 201)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creating role:', error)
    }
    return apiBadRequest('Invalid request body')
  }
}