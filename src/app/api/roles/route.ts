import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { ResourceType, PermissionAction } from '@/lib/permissions'

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
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

    // Get all roles for the tenant
    const roles = await db.role.findMany({
      where: {
        tenantId: currentUser.tenantId
      },
      orderBy: {
        name: 'asc'
      }
    })

    return new Response(JSON.stringify(roles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to create roles
    const hasCreatePermission = await hasPermission(
      currentUser.roleId as string,
      currentUser.tenantId,
      'roles' as ResourceType,
      'create' as PermissionAction
    )
    
    if (!hasCreatePermission) {
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

    // Check if role already exists
    const existingRole = await db.role.findFirst({
      where: {
        name: body.name,
        tenantId: currentUser.tenantId
      }
    })

    if (existingRole) {
      return new Response(JSON.stringify({ error: 'Role with this name already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create the role
    const role = await db.role.create({
      data: {
        name: body.name,
        description: body.description || '',
        permissions: body.permissions || {},
        tenantId: currentUser.tenantId
      }
    })

    return new Response(JSON.stringify(role), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating role:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}