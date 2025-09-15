import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { blacklistToken } from '@/lib/auth'
import logger from '@/lib/logger'

// POST /api/auth/logout - User logout with token blacklisting
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
    
    // If we have a token, blacklist it
    if (token) {
      blacklistToken(token)
    }
    
    // Also check for refresh token in cookies
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))
      if (refreshTokenCookie) {
        const refreshToken = refreshTokenCookie.split('=')[1]
        if (refreshToken) {
          blacklistToken(refreshToken)
        }
      }
    }
    
    // Return success response
    const response = successResponse({ message: 'Logged out successfully' })
    
    // Clear the refresh token cookie
    response.headers.set('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0')
    
    return response
  } catch (error: any) {
    logger.error('Error during logout:', error)
    return errorResponse('Internal server error')
  }
}