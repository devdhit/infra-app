import { NextRequest } from 'next/server'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'
import { verifyRefreshToken, generateToken, blacklistToken } from '@/lib/auth'
import { db } from '@/lib/db'
import logger from '@/lib/logger'

// POST /api/auth/refresh - Refresh access token
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return unauthorizedResponse()
    }
    
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
    const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))
    if (!refreshTokenCookie) {
      return unauthorizedResponse()
    }
    
    const refreshToken = refreshTokenCookie.split('=')[1]
    if (!refreshToken) {
      return unauthorizedResponse()
    }
    
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      // Blacklist invalid token
      blacklistToken(refreshToken)
      return unauthorizedResponse()
    }
    
    // Get user from database
    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: { role: true }
    })
    
    if (!user) {
      // Blacklist invalid token
      blacklistToken(refreshToken)
      return unauthorizedResponse()
    }
    
    // Blacklist the old refresh token
    blacklistToken(refreshToken)
    
    // Generate new tokens
    const newAccessToken = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name || 'user'
    })
    
    const newRefreshToken = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name || 'user'
    })
    
    // Return success response with new tokens
    const response = successResponse({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role?.id,
          name: user.role?.name || 'user'
        },
        tenantId: user.tenantId
      }
    })
    
    // Set new refresh token as HTTP-only cookie
    response.headers.set('Set-Cookie', `refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`)
    
    return response
  } catch (error: any) {
    logger.error('Error during token refresh:', error)
    return errorResponse('Internal server error')
  }
}