import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the Printer asset type
interface PrinterAsset {
  dept: string
  location?: string
  ip?: string
  model?: string
  color: boolean
  barcode: string
  sapCode?: string
  date?: string
  note?: string
}

// Create handler for Printer assets
const printerHandler = new AssetApiHandler<PrinterAsset>(db, {
  modelName: 'printer',
  requiredFields: ['barcode', 'dept'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'dept', 'model', 'ip', 'note'],
  include: {
    histories: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }
  }
})

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
    console.error('Error in Printer GET route:', error)
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
    console.error('Error in Printer POST route:', error)
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
  } catch (error) {
    console.error('Error in Printer bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}
