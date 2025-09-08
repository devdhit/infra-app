import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { laptopHandler } from '@/lib/asset-api-handler'


// POST /api/assets/laptop/bulk-delete - Bulk delete Laptop assets
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
    
    return await laptopHandler.bulkDelete(user, body.ids)
  } catch (error) {
    console.error('Error in Laptop bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}