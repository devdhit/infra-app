import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { printerHandler } from '@/lib/asset-api-handler'
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

// GET /api/assets/printer - Get all Printer assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await printerHandler.getAll(user, queryParams)
  } catch (error) {
    logger.error('Error in Printer GET route:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/assets/printer - Create a new Printer asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<PrinterAsset>(request)
    return await printerHandler.create(user, body)
  } catch (error) {
    logger.error('Error in Printer POST route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/printer - Bulk delete Printer assets
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await printerHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    logger.error('Error in Printer bulk DELETE route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400)
    }
    
    return errorResponse('Failed to delete Printer assets. Please try again later.')
  }
}