import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { warehouseHandler } from '@/lib/asset-api-handler'

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

// DELETE /api/assets/warehouse - Bulk delete WarehouseIT assets
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await warehouseHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    console.error('Error in WarehouseIT bulk DELETE route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400)
    }
    
    return errorResponse('Failed to delete WarehouseIT assets. Please try again later.')
  }
}