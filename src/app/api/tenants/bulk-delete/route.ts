import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { createHistoryRecord } from '@/lib/history'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger';

// POST /api/tenants/bulk-delete - Bulk delete tenants
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user has permission to bulk delete tenants
    const hasBulkDeletePermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'tenants',
      'bulkDelete'
    )
    
    if (!hasBulkDeletePermission) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { ids } = body
    
    logger.info('Received bulk delete request with IDs:', ids);

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid request: ids array is required', 400)
    }
    
    // Log the type of each ID to see if they're being converted
    ids.forEach((id: any, index: number) => {
      logger.info(`ID ${index}:`, id, 'Type:', typeof id);
    });

    // Check if all tenants exist
    const existingTenants = await db.tenant.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    // Check if all requested tenants were found
    const existingTenantIds = existingTenants.map(tenant => tenant.id)
    const missingTenantIds = ids.filter(id => !existingTenantIds.includes(id))
    
    if (missingTenantIds.length > 0) {
      return errorResponse(`Tenants not found: ${missingTenantIds.join(', ')}`, 404)
    }

    // Check if any tenant has associated users or assets
    const tenantsWithRelations = await db.tenant.findMany({
      where: {
        id: {
          in: ids
        }
      },
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
          }
        }
      }
    })

    // Check if any tenant has associated data (excluding histories and audit logs settings since we'll delete those)
    const tenantsWithData = tenantsWithRelations.filter((tenant: any) => 
      tenant._count.users > 0 || 
      tenant._count.pcs > 0 || 
      tenant._count.laptops > 0 || 
      tenant._count.printers > 0 || 
      tenant._count.licenses > 0 ||
      tenant._count.warehouseITs > 0 ||
      tenant._count.internets > 0
    )

    if (tenantsWithData.length > 0) {
      return errorResponse('Cannot delete tenants with associated data. Please delete all associated users and assets first.', 400)
    }

    // Create history records for each tenant
    for (const tenant of tenantsWithRelations) {
      await createHistoryRecord({
        action: 'delete',
        modelType: 'Tenant',
        recordId: tenant.id,
        changes: tenant,
        userId: user.id,
        tenantId: user.tenantId
      })
    }

    // Delete audit logs settings first to avoid foreign key constraint violation
    await db.auditLogsSettings.deleteMany({
      where: { 
        tenantId: {
          in: ids
        }
      }
    })

    // Delete history records first to avoid foreign key constraint violation
    await db.history.deleteMany({
      where: { 
        tenantId: {
          in: ids
        }
      }
    })

    // Perform bulk delete
    await db.tenant.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return successResponse(null, 204)
  } catch (error: any) {
    logger.error('Error in bulk delete tenants route:', error)
    return errorResponse('Failed to delete tenants. Please try again later.')
  }
}