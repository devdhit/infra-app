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

// Define the PC asset type based on the Prisma schema
interface PCAsset {
  dept: string
  cpuBarcode: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  pcName: string
  userId?: string
  status: string
  note?: string
}

// Create handler for PC assets
const pcHandler = new AssetApiHandler<PCAsset>(db, {
  modelName: 'pC',
  requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
  uniqueField: 'cpuBarcode',
  searchFields: ['cpuBarcode', 'pcName', 'dept', 'note'],
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
})

// GET /api/assets/pc - Get all PC assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await pcHandler.getAll(user, queryParams)
  } catch (error) {
    console.error('Error in PC GET route:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/assets/pc - Create a new PC asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<PCAsset>(request)
    return await pcHandler.create(user, body)
  } catch (error) {
    console.error('Error in PC POST route:', error)
    return errorResponse('Internal server error')
  }
}