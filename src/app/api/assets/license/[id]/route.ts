import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse,
  badRequestResponse
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
  searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip'],
  include: {
    customFields: true // Include custom fields in responses
  }
})

// GET /api/assets/license/[id] - Get a specific License asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await licenseHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in License GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/license/[id] - Update a License asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    let body: Partial<LicenseAsset>
    try {
      body = await parseRequestBody<Partial<LicenseAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
    const resolvedParams = await params;
    return await licenseHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in License PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/license/[id] - Delete a License asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await licenseHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in License DELETE route:', error)
    return errorResponse('Internal server error')
  }
}