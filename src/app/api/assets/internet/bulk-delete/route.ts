import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse,
  badRequestResponse
} from '@/lib/api-utils'
import { internetHandler } from '@/lib/asset-api-handler'

// POST /api/assets/internet/bulk-delete - Bulk delete Internet assets
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await internetHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    console.error('Error in Internet bulk delete route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to bulk delete Internet assets. Please try again later.')
  }
}