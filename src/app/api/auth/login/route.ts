import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse, 
  badRequestResponse 
} from '@/lib/api-utils'
import { generateToken, verifyPassword } from '@/lib/auth'

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimiter = new Map<string, { attempts: number; lastAttempt: number }>()

// Rate limiting configuration
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

// Clean up old rate limiter entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimiter.entries()) {
    if (now - value.lastAttempt > CLEANUP_INTERVAL) {
      rateLimiter.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

// Check if an IP is rate limited
function isRateLimited(ip: string): boolean {
  const record = rateLimiter.get(ip)
  if (!record) return false
  
  const now = Date.now()
  if (now - record.lastAttempt > LOCKOUT_TIME) {
    // Lockout period expired, reset attempts
    rateLimiter.delete(ip)
    return false
  }
  
  return record.attempts >= MAX_ATTEMPTS
}

// Record a failed login attempt
function recordFailedAttempt(ip: string): void {
  const record = rateLimiter.get(ip)
  const now = Date.now()
  
  if (record) {
    rateLimiter.set(ip, {
      attempts: record.attempts + 1,
      lastAttempt: now
    })
  } else {
    rateLimiter.set(ip, {
      attempts: 1,
      lastAttempt: now
    })
  }
}

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return errorResponse('Too many login attempts. Please try again later.', 429)
    }

    // Check if content type is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return badRequestResponse('Content-Type must be application/json')
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return badRequestResponse('Invalid JSON in request body')
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return badRequestResponse('Email and password are required')
    }

    // Find user by email with proper error handling
    let user;
    try {
      user = await db.user.findUnique({
        where: { email },
        include: { role: true }
      })
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError)
      return errorResponse('Service temporarily unavailable. Please try again later.', 503)
    }

    // Check if user exists
    if (!user) {
      recordFailedAttempt(ip)
      return errorResponse('Invalid email or password', 401)
    }

    // Verify password with proper error handling
    let isValidPassword;
    try {
      isValidPassword = await verifyPassword(password, user.password)
    } catch (passwordError) {
      console.error('Password verification error:', passwordError)
      return errorResponse('Service temporarily unavailable. Please try again later.', 503)
    }
    
    if (!isValidPassword) {
      recordFailedAttempt(ip)
      return errorResponse('Invalid email or password', 401)
    }

    // Reset rate limiter on successful login
    rateLimiter.delete(ip)

    // Get role name from the related Role object, default to 'user'
    const roleName = user.role?.name || 'user'

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: roleName
    })

    // Return success response with token and user data
    return successResponse({
      token,
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
  } catch (error) {
    console.error('Error in login route:', error)
    return errorResponse('Internal server error')
  }
}