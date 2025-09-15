import { NextRequest } from 'next/server'
import { pcHandler } from '@/lib/asset-api-handler'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse, 
  badRequestResponse,
  parseRequestBody
} from '@/lib/api-utils'
import logger from '@/lib/logger'

// Define the PC asset type based on the Prisma schema
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
  customFields?: any
}

// GET /api/assets/pc/[id] - Get a specific PC asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;
    
    return await pcHandler.getById(user, resolvedParams.id)
  } catch (error: any) {
    logger.error('Error in PC GET by ID route:', { error: error.message, stack: error.stack });
    return errorResponse('Failed to fetch PC asset details. Please try again later.');
  }
}

// PUT /api/assets/pc/[id] - Update a PC asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    let body: Partial<PCAsset>
    try {
      body = await parseRequestBody<Partial<PCAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    return await pcHandler.update(user, resolvedParams.id, body)
  } catch (error: any) {
    logger.error('Error in PC PUT route:', { error: error.message, stack: error.stack });
    return errorResponse('Failed to update PC asset. Please try again later.');
  }
}

// DELETE /api/assets/pc/[id] - Delete a PC asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    return await pcHandler.delete(user, resolvedParams.id)
  } catch (error: any) {
    logger.error('Error in PC DELETE route:', { error: error.message, stack: error.stack });
    return errorResponse('Failed to delete PC asset. Please try again later.');
  }
}