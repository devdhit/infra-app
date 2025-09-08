import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { laptopHandler } from '@/lib/asset-api-handler'

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

// GET /api/assets/laptop - Get all Laptop assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await laptopHandler.getAll(user, queryParams)
  } catch (error) {
    console.error('Error in Laptop GET route:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/assets/laptop - Create a new Laptop asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<LaptopAsset>(request)
    return await laptopHandler.create(user, body)
  } catch (error) {
    console.error('Error in Laptop POST route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/laptop - Bulk delete Laptop assets
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await laptopHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    console.error('Error in Laptop bulk DELETE route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400)
    }
    
    return errorResponse('Failed to delete Laptop assets. Please try again later.')
  }
}