import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'
import logger from '@/lib/logger';

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user has permission to view roles
    const hasViewPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'view'
    )
    
    // For debugging in development only
    if (process.env.NODE_ENV === 'development') {
      logger.info('Role permission check:', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role?.name,
        userRoleId: currentUser.role?.id,
        tenantId: currentUser.tenantId,
        hasViewPermission
      });
    }
    
    if (!hasViewPermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get all roles for the tenant
    const roles = await db.role.findMany({
      where: {
        tenantId: currentUser.tenantId
      },
      orderBy: {
        name: 'asc'
      }
    })

    return successResponse(roles)
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error fetching roles:', error)
    }
    return errorResponse('Internal server error')
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user has permission to create roles
    const hasCreatePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'create'
    )
    
    if (!hasCreatePermission) {
      return errorResponse('Forbidden', 403)
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return badRequestResponse('Invalid JSON in request body')
    }

    // Validate required fields
    if (!body.name) {
      return badRequestResponse('Role name is required')
    }

    // Normalize the role name for comparison (trim whitespace)
    const normalizedName = body.name.trim()

    // Validate permissions structure if provided
    if (body.permissions && typeof body.permissions !== 'object') {
      return badRequestResponse('Invalid permissions structure')
    }

    // Check if role already exists and create in a single operation
    try {
      const role = await db.role.create({
        data: {
          name: normalizedName,
          description: body.description || '',
          permissions: body.permissions || {},
          tenantId: currentUser.tenantId
        }
      })

      return successResponse(role, 201)
    } catch (error: any) {
      // Check if it's a unique constraint violation
      if (error.code === 'P2002') {
        return conflictResponse('A role with this name already exists')
      }
      throw error
    }
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creating role:', error)
    }
    return errorResponse('Internal server error')
  }
}