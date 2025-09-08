import { NextRequest } from 'next/server'
import { warehouseHandler } from '@/lib/asset-api-handler'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse, 
  badRequestResponse,
  parseRequestBody
} from '@/lib/api-utils'

// Define the WarehouseIT asset type
interface WarehouseITAsset {
  barcode?: string
  sapCode?: string
  status: string
  note?: string
  createdAt?: string
  updatedAt?: string
  customFields?: any
}

// GET /api/assets/warehouse/[id] - Get a specific WarehouseIT asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
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

    // Await params before using
    const resolvedParams = await params;

    let body: Partial<WarehouseITAsset>
    try {
      body = await parseRequestBody<Partial<WarehouseITAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
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

    // Await params before using
    const resolvedParams = await params;

    return await warehouseHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in WarehouseIT DELETE route:', error)
    return errorResponse('Internal server error')
  }
}