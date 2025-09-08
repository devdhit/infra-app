import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/tenants - Get all tenants (requires view permission)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

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

    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: { users: true, pcs: true, laptops: true, printers: true, licenses: true }
        }
      }
    })

    return new Response(JSON.stringify(tenants), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/tenants - Create a new tenant (requires create permission)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to create tenants
    const hasCreatePermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'tenants',
      'create'
    )
    
    if (!hasCreatePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const tenant = await db.tenant.create({
      data: {
        name: body.name.trim(),
        description: body.description || ''
      }
    })

    return new Response(JSON.stringify(tenant), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return new Response(JSON.stringify({ error: 'A tenant with this name already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error creating tenant:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}