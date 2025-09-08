import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
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
      console.log('Role permission check:', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role?.name,
        userRoleId: currentUser.role?.id,
        tenantId: currentUser.tenantId,
        hasViewPermission
      });
    }
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }, null, 2), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
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

    return new Response(JSON.stringify(roles, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching roles:', error)
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }, null, 2), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to create roles
    const hasCreatePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'roles',
      'create'
    )
    
    if (!hasCreatePermission) {
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

    // Check if role already exists
    const existingRole = await db.role.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive'
        },
        tenantId: currentUser.tenantId
      }
    })

    if (existingRole) {
      return new Response(JSON.stringify({ error: 'A role with this name already exists' }, null, 2), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate permissions structure if provided
    if (body.permissions && typeof body.permissions !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid permissions structure' }, null, 2), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create the role with the normalized name
    const role = await db.role.create({
      data: {
        name: normalizedName,
        description: body.description || '',
        permissions: body.permissions || {},
        tenantId: currentUser.tenantId
      }
    })

    return new Response(JSON.stringify(role, null, 2), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating role:', error)
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

    // Await params before using
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
    const roleId = resolvedParams.id

    // Validate role exists
    const existingRole = await db.role.findUnique({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    if (!existingRole) {
      return new Response(JSON.stringify({ error: 'Role not found' }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if name is being changed and if new name already exists
    if (body.name && body.name !== existingRole.name) {
      const normalizedName = body.name.trim();
      
      const duplicateRole = await db.role.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive'
          },
          tenantId: currentUser.tenantId,
          NOT: {
            id: roleId
          }
        }
      })

      if (duplicateRole) {
        return new Response(JSON.stringify({ error: 'A role with this name already exists' }, null, 2), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Validate permissions structure if provided
      if (body.permissions && typeof body.permissions !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid permissions structure' }, null, 2), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Update the role with new name
      const role = await db.role.update({
        where: { 
          id: roleId,
          tenantId: currentUser.tenantId
        },
        data: {
          name: normalizedName,
          description: body.description !== undefined ? body.description : existingRole.description,
          permissions: body.permissions || existingRole.permissions
        }
      })

      return new Response(JSON.stringify(role, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      // Validate permissions structure if provided
      if (body.permissions && typeof body.permissions !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid permissions structure' }, null, 2), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Update the role without name change
      const role = await db.role.update({
        where: { 
          id: roleId,
          tenantId: currentUser.tenantId
        },
        data: {
          description: body.description !== undefined ? body.description : existingRole.description,
          permissions: body.permissions || existingRole.permissions
        }
      })

      return new Response(JSON.stringify(role, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error: any) {
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

    // Await params before using
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

    const roleId = resolvedParams.id

    // Validate role exists
    const existingRole = await db.role.findUnique({
      where: { 
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    if (!existingRole) {
      return new Response(JSON.stringify({ error: 'Role not found' }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if role is assigned to any users
    const usersWithRole = await db.user.findFirst({
      where: {
        roleId: roleId
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
        id: roleId,
        tenantId: currentUser.tenantId
      }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
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