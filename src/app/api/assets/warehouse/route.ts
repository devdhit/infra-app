import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse,
  badRequestResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the WarehouseIT asset type
interface WarehouseITAsset {
  cpuBarcode?: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  status: string
  note?: string
}

// Create handler for WarehouseIT assets
const warehouseHandler = new AssetApiHandler<WarehouseITAsset>(db, {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'note']
  // Removed include for histories since we removed the relation
})

// GET /api/assets/warehouse - Get all WarehouseIT assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await warehouseHandler.getAll(user, queryParams)
  } catch (error) {
    console.error('Error in WarehouseIT GET route:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/assets/warehouse - Create a new WarehouseIT asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<WarehouseITAsset>(request)
    return await warehouseHandler.create(user, body)
  } catch (error) {
    console.error('Error in WarehouseIT POST route:', error)
    return errorResponse('Internal server error')
  }
}