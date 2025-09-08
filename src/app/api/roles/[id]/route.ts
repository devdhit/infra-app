import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    if (!hasViewPermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get the role
    const role = await db.role.findUnique({
      where: {
        id: params.id,
        tenantId: currentUser.tenantId
      }
    })

    if (!role) {
      return errorResponse('Role not found', 404)
    }

    return successResponse(role)
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching role:', error)
    }
    return errorResponse('Internal server error')
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user has permission to edit roles
    const hasEditPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'edit'
    )
    
    if (!hasEditPermission) {
      return errorResponse('Forbidden', 403)
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return badRequestResponse('Invalid JSON in request body')
    }

    const roleId = params.id

    // Validate role exists
    const existingRole = await db.role.findUnique({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    if (!existingRole) {
      return errorResponse('Role not found', 404)
    }

    // Prepare update data
    const updateData: any = {
      description: body.description !== undefined ? body.description : existingRole.description,
      permissions: body.permissions || existingRole.permissions
    }

    // Check if name is being changed
    if (body.name && body.name !== existingRole.name) {
      const normalizedName = body.name.trim()
      updateData.name = normalizedName
      
      // Validate permissions structure if provided
      if (body.permissions && typeof body.permissions !== 'object') {
        return badRequestResponse('Invalid permissions structure')
      }
    } else {
      // Validate permissions structure if provided
      if (body.permissions && typeof body.permissions !== 'object') {
        return badRequestResponse('Invalid permissions structure')
      }
    }

    // Update the role
    const role = await db.role.update({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      },
      data: updateData
    })

    return successResponse(role)
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return conflictResponse('A role with this name already exists')
    }
    
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating role:', error)
    }
    return errorResponse('Internal server error')
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user has permission to delete roles
    const hasDeletePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'delete'
    )
    
    if (!hasDeletePermission) {
      return errorResponse('Forbidden', 403)
    }

    const roleId = params.id

    // Validate role exists
    const existingRole = await db.role.findUnique({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    if (!existingRole) {
      return errorResponse('Role not found', 404)
    }

    // Check if role is assigned to any users
    const usersWithRole = await db.user.findFirst({
      where: {
        roleId: roleId
      }
    })

    if (usersWithRole) {
      return badRequestResponse('Cannot delete role that is assigned to users')
    }

    // Delete the role
    await db.role.delete({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    return successResponse(null, 204)
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting role:', error)
    }
    return errorResponse('Internal server error')
  }
}