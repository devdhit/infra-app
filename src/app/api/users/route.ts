import { NextRequest } from 'next/server'
import { userService } from '@/lib/management/services/user.service'
import { checkPermission, apiSuccess, apiError, apiBadRequest } from '@/lib/management/api-helpers'
import logger from '@/lib/logger'

// GET /api/users - Get all users (requires view permission)
export async function GET(request: NextRequest) {
  const { user, error } = await checkPermission(request, 'users', 'view')
  if (error) return error

  try {
    const result = await userService.getTenantUsers(user!.tenantId)
    
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
      logger.error('Error fetching users:', error)
    }
    return apiError('Internal server error', 'INTERNAL_ERROR')
  }
}

// POST /api/users - Create a new user (requires create permission)
export async function POST(request: NextRequest) {
  const { user, error } = await checkPermission(request, 'users', 'create')
  if (error) return error

  try {
    const body = await request.json()
    const result = await userService.createUser(body, user!.tenantId)
    
    if (!result.success) {
      return apiBadRequest(result.error.message)
    }

    return apiSuccess(result.data, 201)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creating user:', error)
    }
    return apiBadRequest('Invalid request body')
  }
}
