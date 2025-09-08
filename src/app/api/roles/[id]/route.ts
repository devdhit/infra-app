import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await the params to get the id
    const resolvedParams = await params;

    // Check if user has permission to view roles
    const hasViewPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'view'
    )
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }, null, 2), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the role
    const role = await db.role.findUnique({
      where: {
        id: resolvedParams.id,
        tenantId: currentUser.tenantId
      }
    })

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role not found' }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(role, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching role:', error)
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await the params to get the id
    const resolvedParams = await params;

    // Check if user has permission to edit roles
    const hasEditPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'edit'
    )
    
    if (!hasEditPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }, null, 2), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Role name is required' }, null, 2), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Normalize the role name for comparison (trim whitespace)
    const normalizedName = body.name.trim();

    // Check if another role with the same name already exists (excluding the current role being updated)
    const existingRole = await db.role.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive'
        },
        tenantId: currentUser.tenantId,
        NOT: {
          id: resolvedParams.id
        }
      }
    })

    if (existingRole) {
      return new Response(JSON.stringify({ error: 'A role with this name already exists' }, null, 2), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update the role with the normalized name
    const role = await db.role.update({
      where: {
        id: resolvedParams.id,
        tenantId: currentUser.tenantId
      },
      data: {
        name: normalizedName,
        description: body.description,
        permissions: body.permissions
      }
    })

    return new Response(JSON.stringify(role, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Role not found' }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating role:', error)
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await the params to get the id
    const resolvedParams = await params;

    // Check if user has permission to delete roles
    const hasDeletePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'delete'
    )
    
    if (!hasDeletePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }, null, 2), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if role is being used by any users
    const usersWithRole = await db.user.findFirst({
      where: {
        roleId: resolvedParams.id,
        tenantId: currentUser.tenantId
      }
    })

    if (usersWithRole) {
      return new Response(JSON.stringify({ error: 'Cannot delete role that is assigned to users' }, null, 2), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete the role
    await db.role.delete({
      where: {
        id: resolvedParams.id,
        tenantId: currentUser.tenantId
      }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Role not found' }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting role:', error)
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}