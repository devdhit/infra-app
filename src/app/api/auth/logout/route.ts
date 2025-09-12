import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import logger from '@/lib/logger'

// Generate a unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      logger.warn('Unauthorized logout attempt', { 
        requestId, 
        component: 'auth-logout' 
      });
      return errorResponse('Unauthorized', 401, { requestId })
    }

    // Log successful logout
    logger.info('User logged out successfully', { 
      requestId, 
      userId: user.id, 
      component: 'auth-logout' 
    });

    // For JWT-based auth, we just return success
    // The client will clear the token
    return successResponse(null)
  } catch (error: any) {
    logger.error('Error in logout route', { 
      requestId, 
      error: error.message, 
      stack: error.stack, 
      component: 'auth-logout' 
    });
    return errorResponse('Internal server error', 500, { requestId })
  }
}