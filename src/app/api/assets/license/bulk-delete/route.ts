import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the License asset type
interface LicenseAsset {
  deviceName?: string
  userName?: string
  dept?: string
  productType?: string
  productKey?: string
  model?: string
  pc?: string
  mac?: string
  ip?: string
  date?: string
  updateStatus?: string
}

// Create handler for License assets
const licenseHandler = new AssetApiHandler<LicenseAsset>(db, {
  modelName: 'License',
  requiredFields: ['productKey'],
  searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip']
  // Removed include for histories since we removed the relation
})

// POST /api/assets/license/bulk-delete - Bulk delete License assets
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
    
    return await licenseHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in License bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}