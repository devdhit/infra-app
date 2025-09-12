import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse, 
  badRequestResponse 
} from '@/lib/api-utils'
import { generateToken, verifyPassword } from '@/lib/auth'
import logger from '@/lib/logger'

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimiter = new Map<string, { attempts: number; lastAttempt: number }>()

// Rate limiting configuration
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

// Store the interval ID so we can clear it if needed
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Clean up old rate limiter entries periodically
if (typeof window === 'undefined') {
  // Only run on server side
  cleanupIntervalId = setInterval(() => {
    try {
      const now = Date.now()
      // Use Array.from to safely iterate over the Map entries
      const entries = Array.from(rateLimiter.entries())
      for (const [key, record] of entries) {
        if (record && (now - record.lastAttempt) >= CLEANUP_INTERVAL) {
          rateLimiter.delete(key)
        }
      }
    } catch (error) {
      logger.error('Error in rate limiter cleanup', { error });
    }
  }, CLEANUP_INTERVAL)
}

// Add cleanup function to clear the interval
export function cleanupLoginRateLimiter() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Check if an IP is rate limited
function isRateLimited(ip: string): boolean {
  try {
    const record = rateLimiter.get(ip)
    if (!record) return false
    
    const now = Date.now()
    if (now - record.lastAttempt > LOCKOUT_TIME) {
      // Lockout period expired, reset attempts
      rateLimiter.delete(ip)
      return false
    }
    
    return record.attempts >= MAX_ATTEMPTS
  } catch (error) {
    logger.error('Error in isRateLimited function', { error, ip });
    // In case of error, don't block the request
    return false
  }
}

// Record a failed login attempt
function recordFailedAttempt(ip: string): void {
  try {
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
  } catch (error) {
    logger.error('Error in recordFailedAttempt function', { error, ip });
  }
}

// Generate a unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// POST /api/auth/login - User login with enhanced security
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let ip = 'unknown'; // Declare ip variable in outer scope
  
  try {
    // Get client IP for rate limiting
    ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      logger.warn('Login attempt blocked due to rate limiting', { 
        requestId, 
        ip, 
        component: 'auth-login' 
      });
      return errorResponse('Too many login attempts. Please try again later.', 429, { requestId })
    }

    // Check if content type is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Invalid content type for login request', { 
        requestId, 
        contentType, 
        ip, 
        component: 'auth-login' 
      });
      return badRequestResponse('Content-Type must be application/json')
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      logger.error('Invalid JSON in login request body', { 
        requestId, 
        ip, 
        error: jsonError.message, 
        component: 'auth-login' 
      });
      return badRequestResponse('Invalid JSON in request body')
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      logger.warn('Missing email or password in login request', { 
        requestId, 
        ip, 
        hasEmail: !!email, 
        hasPassword: !!password, 
        component: 'auth-login' 
      });
      return badRequestResponse('Email and password are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      recordFailedAttempt(ip)
      logger.warn('Invalid email format in login request', { 
        requestId, 
        ip, 
        email, 
        component: 'auth-login' 
      });
      return errorResponse('Invalid email format', 400, { requestId })
    }

    // Find user by email with proper error handling
    let user;
    try {
      logger.debug('Looking up user for login', { 
        requestId, 
        ip, 
        email, 
        component: 'auth-login' 
      });
      user = await db.user.findUnique({
        where: { email },
        include: { role: true }
      });
      
      // Add validation for the user object
      if (user) {
        logger.debug('User found', { 
          requestId, 
          ip, 
          userId: user.id,
          hasPassword: !!user.password,
          hasRole: !!user.role,
          component: 'auth-login' 
        });
      }
    } catch (dbError: any) {
      logger.error('Database error during user lookup', { 
        requestId, 
        ip, 
        email, 
        error: dbError.message, 
        stack: dbError.stack, 
        component: 'auth-login' 
      });
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId })
    }

    // Check if user exists
    if (!user) {
      recordFailedAttempt(ip)
      logger.warn('User not found during login attempt', { 
        requestId, 
        ip, 
        email, 
        component: 'auth-login' 
      });
      return errorResponse('Invalid email or password', 401, { requestId })
    }

    // Verify password with proper error handling and rate limiting
    let isValidPassword;
    try {
      logger.debug('Verifying password for user', { 
        requestId, 
        ip, 
        userId: user.id, 
        component: 'auth-login' 
      });
      
      // Add detailed validation to ensure we have the required data
      logger.debug('Validating password and user password hash', { 
        requestId, 
        ip, 
        userId: user.id,
        hasPassword: password !== undefined && password !== null,
        hasUserPassword: user.password !== undefined && user.password !== null,
        passwordType: typeof password,
        userPasswordType: typeof user.password,
        component: 'auth-login' 
      });
      
      // Check for undefined or null values
      if (password === undefined || password === null) {
        logger.error('Password is undefined or null', { 
          requestId, 
          ip, 
          userId: user.id,
          component: 'auth-login' 
        });
        return errorResponse('Invalid credentials', 401, { requestId });
      }
      
      if (user.password === undefined || user.password === null) {
        logger.error('User password hash is undefined or null', { 
          requestId, 
          ip, 
          userId: user.id,
          component: 'auth-login' 
        });
        return errorResponse('Invalid credentials', 401, { requestId });
      }
      
      // Check for empty strings
      if (password === '') {
        logger.error('Password is empty string', { 
          requestId, 
          ip, 
          userId: user.id,
          component: 'auth-login' 
        });
        return errorResponse('Invalid credentials', 401, { requestId });
      }
      
      if (user.password === '') {
        logger.error('User password hash is empty string', { 
          requestId, 
          ip, 
          userId: user.id,
          component: 'auth-login' 
        });
        return errorResponse('Invalid credentials', 401, { requestId });
      }
      
      logger.debug('Calling verifyPassword function', { 
        requestId, 
        ip, 
        userId: user.id, 
        component: 'auth-login' 
      });
      
      isValidPassword = await verifyPassword(password, user.password, ip);
      
      logger.debug('verifyPassword function completed', { 
        requestId, 
        ip, 
        userId: user.id,
        isValidPassword,
        component: 'auth-login' 
      });
    } catch (passwordError: any) {
      logger.error('Password verification error', { 
        requestId, 
        ip, 
        userId: user.id,
        error: passwordError.message,
        stack: passwordError.stack,
        component: 'auth-login' 
      });
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }
    
    if (!isValidPassword) {
      recordFailedAttempt(ip)
      logger.warn('Invalid password provided for user', { 
        requestId, 
        ip, 
        userId: user.id, 
        component: 'auth-login' 
      });
      return errorResponse('Invalid email or password', 401, { requestId })
    }

    // Reset rate limiter on successful login
    rateLimiter.delete(ip)

    logger.debug('Preparing to generate JWT token', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });

    // Get role name from the related Role object, default to 'user'
    logger.debug('Getting role name from user object', { 
      requestId, 
      ip, 
      userId: user.id,
      hasRole: !!user.role,
      roleName: user.role?.name,
      component: 'auth-login' 
    });
    
    // Make sure roleName is always a string
    const roleName = user.role?.name ? String(user.role.name) : 'employee';
    
    logger.debug('Final role name for token', { 
      requestId, 
      ip, 
      userId: user.id,
      roleName,
      roleNameType: typeof roleName,
      component: 'auth-login' 
    });

    logger.debug('Generating JWT token', { 
      requestId, 
      ip, 
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleName,
      component: 'auth-login' 
    });

    // Add validation before calling generateToken
    logger.debug('Validating parameters for generateToken', {
      requestId, 
      ip, 
      userId: user.id,
      hasId: !!user.id,
      hasEmail: !!user.email,
      hasTenantId: !!user.tenantId,
      hasRoleName: !!roleName,
      idType: typeof user.id,
      emailType: typeof user.email,
      tenantIdType: typeof user.tenantId,
      roleNameType: typeof roleName,
      component: 'auth-login' 
    });

    let token: string;
    try {
      // Validate parameters before calling generateToken
      logger.debug('Validating parameters before generateToken call', {
        requestId, 
        ip, 
        userId: user.id,
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roleName: roleName,
        idType: typeof user.id,
        emailType: typeof user.email,
        tenantIdType: typeof user.tenantId,
        roleNameType: typeof roleName,
        component: 'auth-login' 
      });
      
      if (!user.id || typeof user.id !== 'string') {
        logger.error('Invalid user id for token generation', { 
          requestId, 
          ip, 
          userId: user.id,
          idType: typeof user.id,
          component: 'auth-login' 
        });
        throw new Error('Invalid user id for token generation');
      }
      
      if (!user.email || typeof user.email !== 'string') {
        logger.error('Invalid email for token generation', { 
          requestId, 
          ip, 
          userId: user.id,
          email: user.email,
          emailType: typeof user.email,
          component: 'auth-login' 
        });
        throw new Error('Invalid email for token generation');
      }
      
      if (!user.tenantId || typeof user.tenantId !== 'string') {
        logger.error('Invalid tenantId for token generation', { 
          requestId, 
          ip, 
          userId: user.id,
          tenantId: user.tenantId,
          tenantIdType: typeof user.tenantId,
          component: 'auth-login' 
        });
        throw new Error('Invalid tenantId for token generation');
      }
      
      if (!roleName || typeof roleName !== 'string') {
        logger.error('Invalid role for token generation', { 
          requestId, 
          ip, 
          userId: user.id,
          role: roleName,
          roleType: typeof roleName,
          component: 'auth-login' 
        });
        throw new Error('Invalid role for token generation');
      }
      
      // Generate JWT token with enhanced security
      token = generateToken({
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: roleName
      })
    } catch (tokenError: any) {
      logger.error('Error generating JWT token', { 
        requestId, 
        ip, 
        userId: user.id,
        error: tokenError.message,
        stack: tokenError.stack,
        component: 'auth-login' 
      });
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }

    logger.debug('JWT token generated successfully', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });

    // Log successful login
    logger.info('User logged in successfully', { 
      requestId, 
      ip, 
      userId: user.id, 
      email: user.email, 
      component: 'auth-login' 
    });

    logger.debug('Preparing success response', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });

    // Return success response with token and user data
    try {
      const response = successResponse({
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
      });
      
      logger.debug('Success response created', { 
        requestId, 
        ip, 
        userId: user.id,
        component: 'auth-login' 
      });
      
      return response;
    } catch (responseError: any) {
      logger.error('Error creating success response', { 
        requestId, 
        ip, 
        userId: user.id,
        error: responseError.message,
        stack: responseError.stack,
        component: 'auth-login' 
      });
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }
  } catch (error: any) {
    logger.error('Unexpected error in login route', { 
      requestId, 
      ip, 
      error: error.message, 
      stack: error.stack, 
      component: 'auth-login' 
    });
    return errorResponse('Internal server error', 500, { requestId })
  }
}