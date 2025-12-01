import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse, 
  badRequestResponse 
} from '@/lib/api-utils'
import { generateToken, verifyPassword, generateRefreshToken } from '@/lib/auth'
import logger from '@/lib/logger'
import { validateEmail } from '@/lib/security'
import { logFailedLoginAttempt, logSuccessfulLogin, logUserLockout } from '@/lib/security-audit'

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimiter = new Map<string, { attempts: number; lastAttempt: number }>()

// Rate limiting configuration
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

// Add lockout duration (24 hours)
const ACCOUNT_LOCKOUT_DURATION = 24 * 60 * 60 * 1000 // 24 hours

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

// Parse and validate request body
async function parseAndValidateRequestBody(request: NextRequest, requestId: string, ip: string) {
  // Check if content type is JSON
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('Invalid content type for login request', { 
      requestId, 
      contentType, 
      ip, 
      component: 'auth-login' 
    });
    return { error: badRequestResponse('Content-Type must be application/json') };
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
    return { error: badRequestResponse('Invalid JSON in request body') };
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
    return { error: badRequestResponse('Email and password are required') };
  }

  // Validate email format using enhanced validation
  if (!validateEmail(email)) {
    recordFailedAttempt(ip)
    logger.warn('Invalid email format in login request', { 
      requestId, 
      ip, 
      // Don't log the actual email in production to prevent enumeration attacks
      component: 'auth-login' 
    });
    return { error: errorResponse('Invalid email or password', 401, { requestId }) };
  }

  return { email, password };
}

// Find user by email
async function findUserByEmail(email: string, requestId: string, ip: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: { role: true }
    });
    
    if (!user) {
      logger.warn('User not found during login attempt', { 
        requestId, 
        ip, 
        component: 'auth-login' 
      });
      return null;
    }
    
    return user;
  } catch (dbError: any) {
    logger.error('Database error during user lookup', { 
      requestId, 
      ip, 
      error: dbError.message, 
      stack: dbError.stack, 
      component: 'auth-login' 
    });
    return null;
  }
}

// Check if user account is locked
function isUserAccountLocked(user: any, requestId: string, ip: string) {
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    logger.warn('Login attempt blocked due to locked account', { 
      requestId, 
      ip, 
      userId: user.id,
      lockedUntil: user.lockedUntil,
      component: 'auth-login' 
    });
    return true;
  }
  return false;
}

// Verify user password
async function verifyUserPassword(password: string, user: any, ip: string, requestId: string) {
  try {
    const isValidPassword = await verifyPassword(password, user.password, ip);
    return isValidPassword;
  } catch (passwordError: any) {
    logger.error('Password verification error', { 
      requestId, 
      ip, 
      userId: user.id,
      error: passwordError.message,
      stack: passwordError.stack,
      component: 'auth-login' 
    });
    return null;
  }
}

// Handle failed login attempt
async function handleFailedLoginAttempt(user: any, ip: string, requestId: string, request: NextRequest) {
  // Check if user has 'agent' role - agents should not be locked
  // because they send information requests to the server every 6 hours
  const isAgentUser = user.role?.name === 'agent';
  
  // Increment failed login attempts
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: {
        increment: 1
      },
      lastLoginAttempt: new Date(),
      // Lock account if failed attempts exceed threshold
      // BUT skip locking for agent users
      lockedAt: (!isAgentUser && user.failedLoginAttempts + 1 >= MAX_ATTEMPTS) ? new Date() : user.lockedAt,
      lockedUntil: (!isAgentUser && user.failedLoginAttempts + 1 >= MAX_ATTEMPTS) ? 
        new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION) : user.lockedUntil
    }
  });
  
  recordFailedAttempt(ip)
  logger.warn('Invalid password provided for user', { 
    requestId, 
    ip, 
    userId: user.id,
    userRole: user.role?.name,
    isAgentUser,
    failedAttempts: updatedUser.failedLoginAttempts,
    isLocked: updatedUser.failedLoginAttempts >= MAX_ATTEMPTS && !isAgentUser,
    component: 'auth-login' 
  });
  
  // If account is now locked (and not an agent), log the lockout and return specific error
  if (!isAgentUser && updatedUser.failedLoginAttempts >= MAX_ATTEMPTS) {
    await logUserLockout(user.id, user.tenantId, ip, request.headers.get('user-agent') || undefined)
    return errorResponse('Account is locked due to too many failed attempts. Please contact administrator.', 423, { requestId });
  }
  
  // Generic error message to prevent user enumeration
  return errorResponse('Invalid email or password', 401, { requestId });
}

// Reset login attempts after successful login
async function resetLoginAttempts(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedAt: null,
      lockedUntil: null,
      lastLoginAttempt: new Date()
    }
  });
}

// Generate authentication tokens
function generateAuthTokens(user: any, requestId: string, ip: string) {
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
    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: roleName
    });
    
    return { token };
  } catch (tokenError: any) {
    logger.error('Error generating JWT token', { 
      requestId, 
      ip, 
      userId: user.id,
      error: tokenError.message,
      stack: tokenError.stack,
      component: 'auth-login' 
    });
    return { error: tokenError };
  }
}

// Create success response with tokens
function createSuccessResponse(token: string, user: any) {
  // Generate refresh token
  const refreshToken = generateRefreshToken(user.id);
  
  // Return success response with tokens and user data
  try {
    const response = successResponse({
      token,
      refreshToken,
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
    
    // Set refresh token as HTTP-only cookie for enhanced security
    response.headers.set('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    
    return response;
  } catch (responseError: any) {
    logger.error('Error creating success response', { 
      error: responseError.message,
      stack: responseError.stack,
      component: 'auth-login' 
    });
    return null;
  }
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

    // Parse and validate request body
    const parseResult = await parseAndValidateRequestBody(request, requestId, ip);
    if ('error' in parseResult) {
      return parseResult.error;
    }
    const { email, password } = parseResult;

    // Find user by email
    const user = await findUserByEmail(email, requestId, ip);
    if (!user) {
      recordFailedAttempt(ip)
      // Log failed login attempt
      await logFailedLoginAttempt(email, 'unknown', ip, request.headers.get('user-agent') || undefined)
      // Generic error message to prevent user enumeration
      return errorResponse('Invalid email or password', 401, { requestId })
    }

    // Check if user account is locked
    if (isUserAccountLocked(user, requestId, ip)) {
      return errorResponse('Account is locked. Please contact administrator.', 423, { requestId })
    }

    // Verify password
    const isValidPassword = await verifyUserPassword(password, user, ip, requestId);
    if (isValidPassword === null) {
      // Error occurred during password verification
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }
    
    if (!isValidPassword) {
      // Handle failed login attempt
      return await handleFailedLoginAttempt(user, ip, requestId, request);
    }

    // Reset rate limiter and failed login attempts on successful login
    rateLimiter.delete(ip)
    await resetLoginAttempts(user.id);

    logger.debug('Preparing to generate JWT token', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });

    // Generate authentication tokens
    const tokenResult = generateAuthTokens(user, requestId, ip);
    if ('error' in tokenResult) {
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }
    const { token } = tokenResult;

    logger.debug('JWT token generated successfully', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });

    // Log successful login
    await logSuccessfulLogin(user.id, user.tenantId, ip, request.headers.get('user-agent') || undefined)
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

    // Create success response
    const response = createSuccessResponse(token, user);
    if (!response) {
      return errorResponse('Service temporarily unavailable. Please try again later.', 503, { requestId });
    }
    
    logger.debug('Success response created', { 
      requestId, 
      ip, 
      userId: user.id,
      component: 'auth-login' 
    });
    
    return response;
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