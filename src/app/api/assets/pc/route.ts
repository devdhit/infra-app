import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  getQueryParams,
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { pcHandler, PCAsset } from '@/lib/asset-api-handler'
import logger from '@/lib/logger'

// GET /api/assets/pc - Get all PC assets for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const queryParams = getQueryParams(request)
    return await pcHandler.getAll(user, queryParams)
  } catch (error: any) {
    logger.error('Error in PC GET route:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    });
    return errorResponse('Failed to fetch PC assets. Please try again later.');
  }
}

// POST /api/assets/pc - Create a new PC asset
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>(request)
    return await pcHandler.create(user, body)
  } catch (error: any) {
    logger.error('Error in PC POST route:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    });
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return errorResponse('Invalid request body. Please ensure the request is valid JSON.', 400);
    }
    
    // Handle Prisma validation errors
    if (error.code === 'P2002') {
      return errorResponse('A PC with this CPU barcode already exists.', 409);
    }
    
    // Handle validation errors
    if (error.message && error.message.includes('Validation')) {
      return errorResponse(error.message, 400);
    }
    
    return errorResponse('Failed to create PC asset. Please try again later.');
  }
}