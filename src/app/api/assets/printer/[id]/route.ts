import { NextRequest } from 'next/server'
import { printerHandler } from '@/lib/asset-api-handler'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse, 
  badRequestResponse,
  parseRequestBody
} from '@/lib/api-utils'
import logger from '@/lib/logger'

// Define the Printer asset type
interface PrinterAsset {
  dept: string
  location?: string
  ip?: string
  model?: string
  color: string
  barcode: string
  sapCode?: string
  date?: string
  note?: string
  customFields?: any
}

// GET /api/assets/printer/[id] - Get a specific Printer asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    return await printerHandler.getById(user, resolvedParams.id)
  } catch (error) {
    logger.error('Error in Printer GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/printer/[id] - Update a Printer asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    let body: Partial<PrinterAsset>
    try {
      body = await parseRequestBody<Partial<PrinterAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    return await printerHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    logger.error('Error in Printer PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/printer/[id] - Delete a Printer asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    return await printerHandler.delete(user, resolvedParams.id)
  } catch (error) {
    logger.error('Error in Printer DELETE route:', error)
    return errorResponse('Internal server error')
  }
}