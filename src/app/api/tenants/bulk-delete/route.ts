import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { PrismaClient } from '@prisma/client'
import { createHistoryRecord } from '@/lib/history'

const prisma = new PrismaClient()

// POST /api/tenants/bulk-delete - Bulk delete tenants
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'admin') {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { ids } = body

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid request: ids array is required', 400)
    }

    // Check if any tenant has associated users or assets
    const tenantsWithRelations = await prisma.tenant.findMany({
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
            licenses: true
          }
        }
      }
    })

    // Check if any tenant has associated data
    const tenantsWithData = tenantsWithRelations.filter((tenant: any) => 
      tenant._count.users > 0 || 
      tenant._count.pcs > 0 || 
      tenant._count.laptops > 0 || 
      tenant._count.printers > 0 || 
      tenant._count.licenses > 0
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

    // Perform bulk delete
    await prisma.tenant.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return successResponse(null, 204)
  } catch (error: any) {
    console.error('Error in bulk delete tenants route:', error)
    return errorResponse('Failed to delete tenants. Please try again later.')
  }
}