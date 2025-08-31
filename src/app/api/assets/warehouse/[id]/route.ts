import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
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
  createdAt?: string
  updatedAt?: string
}

// Create handler for WarehouseIT assets
const warehouseHandler = new AssetApiHandler<WarehouseITAsset>(db, {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'note'],
  include: {
    customFields: true // Include custom fields in responses
  }
})

// GET /api/assets/warehouse/[id] - Get a specific WarehouseIT asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await warehouseHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in WarehouseIT GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/warehouse/[id] - Update a WarehouseIT asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    let body: Partial<WarehouseITAsset>
    try {
      body = await parseRequestBody<Partial<WarehouseITAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    const resolvedParams = await params;
    return await warehouseHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in WarehouseIT PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/warehouse/[id] - Delete a WarehouseIT asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await warehouseHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in WarehouseIT DELETE route:', error)
    return errorResponse('Internal server error')
  }
}