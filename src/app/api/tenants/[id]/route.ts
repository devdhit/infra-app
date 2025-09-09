import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { createHistoryRecord } from '@/lib/history'

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
          select: { users: true, pcs: true, laptops: true, printers: true, licenses: true, warehouseITs: true, internets: true }
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
    
    console.log('Received delete request for tenant ID:', resolvedParams.id, 'Type:', typeof resolvedParams.id);

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

    // Check if tenant exists first
    const existingTenant = await db.tenant.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingTenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if tenant has any associated data
    const tenantWithRelations = await db.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { 
            users: true, 
            pcs: true, 
            laptops: true, 
            printers: true, 
            licenses: true, 
            warehouseITs: true, 
            internets: true,
            histories: true
            // Removed auditLogsSettings as it's a relation, not a countable field
          }
        }
      }
    })

    // Check if tenant has any associated data (excluding histories and audit logs settings since we'll delete those)
    if (tenantWithRelations && (tenantWithRelations._count.users > 0 || 
        tenantWithRelations._count.pcs > 0 || 
        tenantWithRelations._count.laptops > 0 || 
        tenantWithRelations._count.printers > 0 || 
        tenantWithRelations._count.licenses > 0 || 
        tenantWithRelations._count.warehouseITs > 0 || 
        tenantWithRelations._count.internets > 0)) {
      return new Response(JSON.stringify({ error: 'Cannot delete tenant with associated data. Please delete all associated users and assets first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create history record for the deletion
    await createHistoryRecord({
      action: 'delete',
      modelType: 'Tenant',
      recordId: existingTenant.id,
      changes: existingTenant,
      userId: user.id,
      tenantId: user.tenantId
    })

    // Delete audit logs settings first to avoid foreign key constraint violation
    await db.auditLogsSettings.deleteMany({
      where: { tenantId: resolvedParams.id }
    })

    // Delete history records first to avoid foreign key constraint violation
    await db.history.deleteMany({
      where: { tenantId: resolvedParams.id }
    })

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