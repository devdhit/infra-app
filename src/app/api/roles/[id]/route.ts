import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { ResourceType, PermissionAction } from '@/lib/permissions'

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to view roles
    const hasViewPermission = await hasPermission(
      currentUser.roleId as string,
      currentUser.tenantId,
      'roles' as ResourceType,
      'view' as PermissionAction
    )
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the role
    const role = await db.role.findUnique({
      where: {
        id: params.id,
        tenantId: currentUser.tenantId
      }
    })

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(role), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to edit roles
    const hasEditPermission = await hasPermission(
      currentUser.roleId as string,
      currentUser.tenantId,
      'roles' as ResourceType,
      'edit' as PermissionAction
    )
    
    if (!hasEditPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Role name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if another role with the same name already exists
    const existingRole = await db.role.findFirst({
      where: {
        name: body.name,
        tenantId: currentUser.tenantId,
        NOT: {
          id: params.id
        }
      }
    })

    if (existingRole) {
      return new Response(JSON.stringify({ error: 'Role with this name already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update the role
    const role = await db.role.update({
      where: {
        id: params.id,
        tenantId: currentUser.tenantId
      },
      data: {
        name: body.name,
        description: body.description,
        permissions: body.permissions
      }
    })

    return new Response(JSON.stringify(role), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error updating role:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to delete roles
    const hasDeletePermission = await hasPermission(
      currentUser.roleId as string,
      currentUser.tenantId,
      'roles' as ResourceType,
      'delete' as PermissionAction
    )
    
    if (!hasDeletePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if role is being used by any users
    const usersWithRole = await db.user.findFirst({
      where: {
        roleId: params.id,
        tenantId: currentUser.tenantId
      }
    })

    if (usersWithRole) {
      return new Response(JSON.stringify({ error: 'Cannot delete role that is assigned to users' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete the role
    await db.role.delete({
      where: {
        id: params.id,
        tenantId: currentUser.tenantId
      }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error deleting role:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}