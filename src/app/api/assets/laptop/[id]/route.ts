import { NextRequest } from 'next/server'
import { laptopHandler } from '@/lib/asset-api-handler'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse, 
  badRequestResponse,
  parseRequestBody
} from '@/lib/api-utils'
import logger from '@/lib/logger'

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
  customFields?: any
}

// GET /api/assets/laptop/[id] - Get a specific Laptop asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    return await laptopHandler.getById(user, resolvedParams.id)
  } catch (error) {
    logger.error('Error in Laptop GET by ID route:', error)
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

    // Await params before using
    const resolvedParams = await params;

    let body: Partial<LaptopAsset>
    try {
      body = await parseRequestBody<Partial<LaptopAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    return await laptopHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    logger.error('Error in Laptop PUT route:', error)
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

    // Await params before using
    const resolvedParams = await params;

    return await laptopHandler.delete(user, resolvedParams.id)
  } catch (error) {
    logger.error('Error in Laptop DELETE route:', error)
    return errorResponse('Internal server error')
  }
}