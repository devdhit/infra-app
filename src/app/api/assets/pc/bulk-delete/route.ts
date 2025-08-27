import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the PC asset type (matching the model in route.ts)
interface PCAsset {
  assetTag: string
  model: string
  serialNumber: string
  manufacturer?: string
  processor?: string
  ram?: string
  storage?: string
  operatingSystem?: string
  status: string
  assignedTo?: string
  department?: string
  location?: string
  purchaseDate?: Date
  warrantyExpiry?: Date
  notes?: string
}

// Create handler for PC assets
const pcHandler = new AssetApiHandler<PCAsset>(db, {
  modelName: 'pC',
  requiredFields: ['assetTag', 'model', 'serialNumber', 'status'],
  uniqueField: 'assetTag',
  searchFields: ['assetTag', 'model', 'serialNumber', 'assignedTo', 'department', 'notes'],
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

// POST /api/assets/pc/bulk-delete - Bulk delete PC assets
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
    
    return await pcHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in PC bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}