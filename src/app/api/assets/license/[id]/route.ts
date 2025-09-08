import { NextRequest } from 'next/server'
import { licenseHandler } from '@/lib/asset-api-handler'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse, 
  badRequestResponse,
  parseRequestBody
} from '@/lib/api-utils'

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

// GET /api/assets/license/[id] - Get a specific License asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
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

    // Await params before using
    const resolvedParams = await params;

    let body: Partial<LicenseAsset>
    try {
      body = await parseRequestBody<Partial<LicenseAsset>>(request)
    } catch (parseError: any) {
      return badRequestResponse(parseError.message)
    }
    
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

    // Await params before using
    const resolvedParams = await params;

    return await licenseHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in License DELETE route:', error)
    return errorResponse('Internal server error')
  }
}