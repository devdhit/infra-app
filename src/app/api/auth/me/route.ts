import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

// GET /api/auth/me - Get current user information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return errorResponse('Unauthorized', 401, { quiet: true });
    }

    // Return user information without sensitive data
    const { password, ...userWithoutPassword } = user;
    return successResponse(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user data:', error)
    return errorResponse('Internal server error');
  }
}