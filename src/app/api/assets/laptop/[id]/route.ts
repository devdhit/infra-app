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

// Define the Laptop asset type
interface LaptopAsset {
  dept: string
  barcode: string
  sapBarcode?: string
  dateBuy?: string
  userName?: string
  email?: string
  model?: string
  status: string
}

// Create handler for Laptop assets
const laptopHandler = new AssetApiHandler<LaptopAsset>(db, {
  modelName: 'Laptop',
  requiredFields: ['dept', 'barcode', 'status'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'dept', 'model']
})

// GET /api/assets/laptop/[id] - Get a specific Laptop asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await laptopHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Laptop GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/laptop/[id] - Update a Laptop asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    let body: Partial<LaptopAsset>
    try {
      body = await parseRequestBody<Partial<LaptopAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    const resolvedParams = await params;
    return await laptopHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in Laptop PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/laptop/[id] - Delete a Laptop asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await laptopHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Laptop DELETE route:', error)
    return errorResponse('Internal server error')
  }
}