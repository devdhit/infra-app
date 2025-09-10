import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { licenseHandler } from '@/lib/asset-api-handler'
import logger from '@/lib/logger'

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
  customFields?: any
}

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
    logger.error('Error in License GET route:', error)
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
    logger.error('Error in License POST route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/license - Bulk delete License assets
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await licenseHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    logger.error('Error in License bulk DELETE route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400)
    }
    
    return errorResponse('Failed to delete License assets. Please try again later.')
  }
}