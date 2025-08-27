import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
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
  modelName: 'Printer',
  requiredFields: ['dept', 'barcode', 'color'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'dept', 'model', 'ip', 'note'],
  include: {}
})

// POST /api/assets/printer/bulk-delete - Bulk delete Printer assets
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    if (!body.ids || !Array.isArray(body.ids)) {
      return errorResponse('Invalid request: ids array is required', 400)
    }
    
    return await printerHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in Printer bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}