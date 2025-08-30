import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
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

// POST /api/assets/laptop/bulk-delete - Bulk delete Laptop assets
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
    
    return await laptopHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in Laptop bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}