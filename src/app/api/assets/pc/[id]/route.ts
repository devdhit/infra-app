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

// Define the PC asset type (matching the model in route.ts)
interface PCAsset {
  dept: string
  cpuBarcode: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  pcName: string
  userName?: string
  status: string
  note?: string
}

// Create handler for PC assets
const pcHandler = new AssetApiHandler<PCAsset>(db, {
  modelName: 'PC',
  requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
  uniqueField: 'cpuBarcode',
  searchFields: ['cpuBarcode', 'pcName', 'dept', 'note'],
  include: {
    customFields: true // Include custom fields in responses
  }
})

// GET /api/assets/pc/[id] - Get a specific PC asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await pcHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in PC GET by ID route:', error)
    return errorResponse('Failed to fetch PC asset details. Please try again later.')
  }
}

// PUT /api/assets/pc/[id] - Update a PC asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    let body: Partial<PCAsset>
    try {
      body = await parseRequestBody<Partial<PCAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    const resolvedParams = await params;
    return await pcHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in PC PUT route:', error)
    return errorResponse('Failed to update PC asset. Please try again later.')
  }
}

// DELETE /api/assets/pc/[id] - Delete a PC asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await pcHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in PC DELETE route:', error)
    return errorResponse('Failed to delete PC asset. Please try again later.')
  }
}