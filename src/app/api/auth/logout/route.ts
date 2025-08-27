import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    // For JWT-based auth, we just return success
    // The client will clear the token
    return successResponse(null)
  } catch (error) {
    console.error('Error in logout route:', error)
    return errorResponse('Internal server error')
  }
}