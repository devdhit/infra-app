import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse,
  badRequestResponse
} from '@/lib/api-utils'
import { internetHandler } from '@/lib/asset-api-handler'
import logger from '@/lib/logger'

// Define the Internet asset type based on the Prisma schema
interface InternetAsset {
  dept: string
  manager?: string
  userName?: string
  email?: string
  ipAddress?: string
  internetAccess?: string
  status: string
  note?: string
  customFields?: any
}

// GET /api/assets/internet - Get all Internet assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await internetHandler.getAll(user, queryParams)
  } catch (error) {
    logger.error('Error in Internet GET route:', error)
    return errorResponse('Failed to fetch Internet assets. Please try again later.')
  }
}

// POST /api/assets/internet - Create a new Internet asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<InternetAsset>(request)
    return await internetHandler.create(user, body)
  } catch (error: any) {
    logger.error('Error in Internet POST route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to create Internet asset. Please try again later.')
  }
}

// DELETE /api/assets/internet - Bulk delete Internet assets
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<{ ids: string[] }>(request)
    return await internetHandler.bulkDelete(user, body.ids)
  } catch (error: any) {
    logger.error('Error in Internet bulk DELETE route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to delete Internet assets. Please try again later.')
  }
}