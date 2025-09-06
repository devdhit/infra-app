import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/api-utils'

// POST /api/permissions/check - Check if user has permission
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Safely parse request body
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      console.warn('Invalid JSON in request body:', parseError)
      return errorResponse('Invalid JSON in request body', 400)
    }

    // Check if body is empty or undefined
    if (!body || Object.keys(body).length === 0) {
      console.warn('Missing request body or empty body')
      return errorResponse('Missing request body', 400)
    }

    const { roleId, tenantId, resource, action } = body

    // Validate input
    if (!roleId || !tenantId || !resource || !action) {
      console.warn('Missing required parameters:', { roleId, tenantId, resource, action })
      return errorResponse('Missing required parameters', 400)
    }

    // Check if user has permission
    const hasPerm = await hasPermission(roleId, tenantId, resource, action)

    return successResponse({ hasPermission: hasPerm })
  } catch (error) {
    console.error('Error checking permissions:', error)
    return errorResponse('Internal server error')
  }
}