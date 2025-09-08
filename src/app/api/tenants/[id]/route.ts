import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/tenants/[id] - Get a specific tenant
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to view tenants
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'tenants',
      'view'
    )
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Regular users can only access their own tenant
    // Admins can access any tenant
    const userRoleName = user.role?.name || 'user';
    if (userRoleName !== 'admin' && user.tenantId !== resolvedParams.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const tenant = await db.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { users: true, pcs: true, laptops: true, printers: true, licenses: true }
        }
      }
    })

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(tenant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/tenants/[id] - Update a tenant (requires edit permission)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to edit tenants
    const hasEditPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'tenants',
      'edit'
    )
    
    if (!hasEditPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    
    // Validate input
    if (body.name !== undefined && (!body.name || body.name.trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Tenant name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const tenant = await db.tenant.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        description: body.description
      }
    })

    return new Response(JSON.stringify(tenant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return new Response(JSON.stringify({ error: 'A tenant with this name already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error updating tenant:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE /api/tenants/[id] - Delete a tenant (requires delete permission)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to delete tenants
    const hasDeletePermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'tenants',
      'delete'
    )
    
    if (!hasDeletePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if tenant has any associated data
    const tenant = await db.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { users: true, pcs: true, laptops: true, printers: true, licenses: true }
        }
      }
    })

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prevent deletion if tenant has associated data
    if (tenant._count.users > 0 || tenant._count.pcs > 0 || tenant._count.laptops > 0 || 
        tenant._count.printers > 0 || tenant._count.licenses > 0) {
      return new Response(JSON.stringify({ error: 'Cannot delete tenant with associated data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await db.tenant.delete({
      where: { id: resolvedParams.id }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error deleting tenant:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}