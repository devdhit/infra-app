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
  searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'updateStatus'],
  include: {}
})

// GET /api/assets/license - Get all License assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await licenseHandler.getAll(user, queryParams)
  } catch (error) {
    console.error('Error in License GET route:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/assets/license - Create a new License asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<LicenseAsset>(request)
    return await licenseHandler.create(user, body)
  } catch (error) {
    console.error('Error in License POST route:', error)
    return errorResponse('Internal server error')
  }
}