import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { printerHandler } from '@/lib/asset-api-handler'
import logger from '@/lib/logger'

// POST /api/assets/printer/bulk-delete - Bulk delete Printer assets
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
    
    return await printerHandler.bulkDelete(user, body.ids)
  } catch (error) {
    logger.error('Error in Printer bulk DELETE route:', error)
    return errorResponse('Internal server error')
  }
}