import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the WarehouseIT asset type
interface WarehouseITAsset {
  dept?: string
  cpuBarcode?: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  status: string
  note?: string
  createdAt?: string
  updatedAt?: string
}

// Create handler for WarehouseIT assets
const warehouseHandler = new AssetApiHandler<WarehouseITAsset>(db, {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'note']
  // Removed include for histories since we removed the relation
})

// POST /api/assets/warehouse/bulk-delete - Bulk delete WarehouseIT assets
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    if (!body.ids || !Array.isArray(body.ids)) {
      return errorResponse('Invalid request: ids array is required', 400)
    }
    
    return await warehouseHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in WarehouseIT bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}