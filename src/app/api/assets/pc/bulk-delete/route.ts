import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { pcHandler } from '@/lib/asset-api-handler'


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