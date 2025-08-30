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