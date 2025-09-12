// Only import and use PrismaClient on the server side
import { db } from './db';

import { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import type { UserJwtPayload, User } from '@/types/users'
import logger from '@/lib/logger'

// Use environment-specific JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
const SALT_ROUNDS = 12 // Increased rounds for better security

// Token expiration based on environment
const TOKEN_EXPIRATION = process.env.NODE_ENV === 'production' ? '24h' : '7d'

// Log environment information
logger.debug('Auth module initialized', {
  hasJwtSecret: !!process.env.JWT_SECRET,
  jwtSecretLength: process.env.JWT_SECRET?.length,
  nodeEnv: process.env.NODE_ENV,
  saltRounds: SALT_ROUNDS
});

logger.debug('Token expiration setting', { 
  tokenExpiration: TOKEN_EXPIRATION,
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production'
});

// Simple in-memory cache for user data (in production, you might want to use Redis)
const userCache: Record<string, { user: User; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for password verification to prevent timing attacks
const rateLimiter = new Map<string, { attempts: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

/**
 * Generate a JWT token for a user with enhanced security
 */
export function generateToken(user: { id: string; email: string; tenantId: string; role: string }): string {
  logger.debug('Generating JWT token', { 
    userId: user.id, 
    email: user.email, 
    tenantId: user.tenantId, 
    role: user.role 
  });
  
  // Add detailed validation of the user parameter
  logger.debug('Validating user parameter', {
    user: typeof user,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userTenantId: user?.tenantId,
    userRole: user?.role,
    userKeys: user ? Object.keys(user) : []
  });
  
  if (!user) {
    logger.error('User parameter is null or undefined');
    throw new Error('User parameter is required');
  }
  
  if (typeof user !== 'object') {
    logger.error('User parameter is not an object', { userType: typeof user });
    throw new Error('User parameter must be an object');
  }
  
  // Add detailed validation
  logger.debug('Validating JWT token parameters', {
    hasId: !!user.id,
    hasEmail: !!user.email,
    hasTenantId: !!user.tenantId,
    hasRole: !!user.role,
    idType: typeof user.id,
    emailType: typeof user.email,
    tenantIdType: typeof user.tenantId,
    roleType: typeof user.role
  });
  
  if (!user.id) {
    logger.error('Missing id for JWT token generation', { userId: user.id });
    throw new Error('Missing id for token generation');
  }
  
  if (!user.email) {
    logger.error('Missing email for JWT token generation', { email: user.email });
    throw new Error('Missing email for token generation');
  }
  
  if (!user.tenantId) {
    logger.error('Missing tenantId for JWT token generation', { tenantId: user.tenantId });
    throw new Error('Missing tenantId for token generation');
  }
  
  if (!user.role) {
    logger.error('Missing role for JWT token generation', { role: user.role });
    throw new Error('Missing role for token generation');
  }
  
  // Add additional security claims
  const now = Math.floor(Date.now() / 1000)
  logger.debug('Creating JWT payload', { now });
  
  // Remove the exp from the payload and use expiresIn option instead
  const payload = {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    iat: now // Issued at
    // Remove exp from here as we'll use expiresIn option
  };
  
  // Add validation for payload values
  logger.debug('Validating payload values', {
    id: typeof payload.id,
    email: typeof payload.email,
    tenantId: typeof payload.tenantId,
    role: typeof payload.role,
    iat: typeof payload.iat
  });
  
  // Ensure all required fields are strings
  if (typeof payload.id !== 'string' || payload.id.length === 0) {
    logger.error('Invalid user id for JWT payload', { id: payload.id, idType: typeof payload.id });
    throw new Error('Invalid user id for token generation');
  }
  
  if (typeof payload.email !== 'string' || payload.email.length === 0) {
    logger.error('Invalid email for JWT payload', { email: payload.email, emailType: typeof payload.email });
    throw new Error('Invalid email for token generation');
  }
  
  if (typeof payload.tenantId !== 'string' || payload.tenantId.length === 0) {
    logger.error('Invalid tenantId for JWT payload', { tenantId: payload.tenantId, tenantIdType: typeof payload.tenantId });
    throw new Error('Invalid tenantId for token generation');
  }
  
  if (typeof payload.role !== 'string' || payload.role.length === 0) {
    logger.error('Invalid role for JWT payload', { role: payload.role, roleType: typeof payload.role });
    throw new Error('Invalid role for token generation');
  }
  
  logger.debug('JWT payload created', { payload });
  
  // Check JWT_SECRET
  logger.debug('Checking JWT_SECRET', { 
    hasJwtSecret: !!JWT_SECRET,
    jwtSecretType: typeof JWT_SECRET,
    jwtSecretLength: JWT_SECRET?.length
  });
  
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is not set');
    throw new Error('JWT_SECRET is not set');
  }
  
  if (typeof JWT_SECRET !== 'string') {
    logger.error('JWT_SECRET is not a string', { type: typeof JWT_SECRET });
    throw new Error('JWT_SECRET must be a string');
  }
  
  if (JWT_SECRET.length < 10) {
    logger.error('JWT_SECRET is too short', { length: JWT_SECRET.length });
    throw new Error('JWT_SECRET must be at least 10 characters long');
  }
  
  logger.debug('Calling jwt.sign', { 
    payloadKeys: Object.keys(payload),
    hasJwtSecret: !!JWT_SECRET
  });
  
  // Use expiresIn option instead of exp in payload
  const options: jwt.SignOptions = { 
    expiresIn: TOKEN_EXPIRATION
  };
  
  logger.debug('JWT sign options', { options });
  
  // Add detailed error handling around jwt.sign
  let token: string;
  try {
    logger.debug('About to call jwt.sign with payload, secret, and options', {
      payloadType: typeof payload,
      payloadKeys: Object.keys(payload),
      secretType: typeof JWT_SECRET,
      secretLength: JWT_SECRET.length,
      optionsType: typeof options,
      optionsKeys: Object.keys(options)
    });
    
    // Validate inputs before calling jwt.sign
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Invalid payload: expected object, got ${typeof payload}`);
    }
    
    if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
      throw new Error(`Invalid secret: expected non-empty string, got ${typeof JWT_SECRET}`);
    }
    
    if (!options || typeof options !== 'object') {
      throw new Error(`Invalid options: expected object, got ${typeof options}`);
    }
    
    // Check for conflicting exp claims
    if ('exp' in payload) {
      logger.warn('Payload contains exp claim which may conflict with expiresIn option', {
        expValue: payload.exp,
        expiresIn: options.expiresIn
      });
    }
    
    token = jwt.sign(
      payload,
      JWT_SECRET,
      options
    );
    logger.debug('jwt.sign completed successfully');
  } catch (signError: any) {
    logger.error('Error in jwt.sign', { 
      userId: user.id,
      errorMessage: signError.message,
      errorStack: signError.stack,
      errorName: signError.name,
      payload: {
        ...payload,
        // Don't log the actual values for security, just types and keys
        idType: typeof payload.id,
        emailType: typeof payload.email,
        tenantIdType: typeof payload.tenantId,
        roleType: typeof payload.role,
        iatType: typeof payload.iat
      },
      hasJwtSecret: !!JWT_SECRET,
      jwtSecretType: typeof JWT_SECRET,
      jwtSecretLength: JWT_SECRET?.length,
      options: {
        ...options,
        // Don't log the actual values for security, just types and keys
        expiresInType: typeof options.expiresIn
      }
    });
    throw new Error(`JWT signing failed: ${signError.message}`);
  }
  
  logger.debug('JWT token generated successfully', { userId: user.id, tokenLength: token.length });
  return token;
}

/**
 * Verify a JWT token and return the payload with enhanced security
 */
export function verifyToken(token: string): UserJwtPayload | null {
  try {
    // Verify token with additional security checks
    const payload = jwt.verify(token, JWT_SECRET, {
      // issuer: 'ITAMS',
      // audience: 'ITAMS-users'
    }) as UserJwtPayload
    
    // Additional validation
    if (!payload.id || !payload.email || !payload.tenantId || !payload.role) {
      logger.warn('JWT token missing required fields');
      return null;
    }
    
    return payload;
  } catch (error) {
    logger.warn('JWT token verification failed:', error);
    return null;
  }
}

/**
 * Check if an IP is rate limited for password verification
 */
function isRateLimited(ip: string): boolean {
  try {
    logger.debug('Checking if IP is rate limited', { ip });
    const record = rateLimiter.get(ip);
    logger.debug('Rate limiter record', { ip, hasRecord: !!record });
    
    if (!record) {
      logger.debug('No rate limiter record found for IP', { ip });
      return false;
    }
    
    const now = Date.now();
    logger.debug('Checking lockout time', { 
      ip, 
      now, 
      lastAttempt: record.lastAttempt, 
      lockoutTime: LOCKOUT_TIME,
      timeDiff: now - record.lastAttempt,
      isExpired: now - record.lastAttempt > LOCKOUT_TIME
    });
    
    if (now - record.lastAttempt > LOCKOUT_TIME) {
      // Lockout period expired, reset attempts
      logger.debug('Lockout period expired, resetting attempts', { ip });
      rateLimiter.delete(ip);
      return false;
    }
    
    const isRateLimited = record.attempts >= MAX_ATTEMPTS;
    logger.debug('Rate limiting check result', { ip, isRateLimited, attempts: record.attempts, maxAttempts: MAX_ATTEMPTS });
    return isRateLimited;
  } catch (error) {
    logger.error('Error in isRateLimited function', { error, ip });
    // In case of error, don't block the request
    return false;
  }
}

/**
 * Record a failed password verification attempt
 */
function recordFailedAttempt(ip: string): void {
  try {
    logger.debug('Recording failed attempt', { ip });
    const record = rateLimiter.get(ip);
    const now = Date.now();
    
    logger.debug('Current rate limiter record', { ip, hasRecord: !!record });
    
    if (record) {
      logger.debug('Updating existing record', { ip, currentAttempts: record.attempts });
      rateLimiter.set(ip, {
        attempts: record.attempts + 1,
        lastAttempt: now
      });
    } else {
      logger.debug('Creating new record', { ip });
      rateLimiter.set(ip, {
        attempts: 1,
        lastAttempt: now
      });
    }
    
    logger.debug('Failed attempt recorded', { ip, attempts: rateLimiter.get(ip)?.attempts });
  } catch (error) {
    logger.error('Error in recordFailedAttempt function', { error, ip });
  }
}

/**
 * Get the current user from the request with enhanced security and performance
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    // First check for token in Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    } 
    // Fallback to checking cookies
    else {
      token = request.cookies.get('auth-token')?.value
    }
    
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      logger.debug('JWT token expired');
      return null;
    }

    // Create cache key
    const cacheKey = payload.id;
    
    // Check if we have a cached user that's still valid
    const cachedUser = userCache[cacheKey];
    if (cachedUser && (Date.now() - cachedUser.timestamp) < CACHE_TTL) {
      logger.debug(`Returning cached user for ID: ${payload.id}`);
      return cachedUser.user;
    }

    // Fetch user from database with role relation
    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: { tenant: true, role: true }
    })

    // If user exists, convert the role permissions from JsonValue to Record<string, string[]>
    // and convert Date objects to strings
    if (user && user.role) {
      const formattedUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        role: {
          ...user.role,
          createdAt: user.role.createdAt.toISOString(),
          updatedAt: user.role.updatedAt.toISOString(),
          permissions: user.role.permissions as Record<string, string[]>
        },
        tenant: user.tenant ? {
          ...user.tenant,
          createdAt: user.tenant.createdAt.toISOString(),
          updatedAt: user.tenant.updatedAt.toISOString()
        } : null
      } as User;
      
      // Cache the user
      userCache[cacheKey] = {
        user: formattedUser,
        timestamp: Date.now()
      };
      
      logger.debug(`Caching user data for ID: ${payload.id}`);
      
      // For admin users, we can optimize by pre-setting all permissions
      if (user.role.name === 'admin') {
        // No additional optimization needed here as the permission system already handles this
      }
      
      return formattedUser;
    }

    // Convert Date objects to strings for users without roles
    if (user) {
      const formattedUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        tenant: user.tenant ? {
          ...user.tenant,
          createdAt: user.tenant.createdAt.toISOString(),
          updatedAt: user.tenant.updatedAt.toISOString()
        } : null
      } as User;
      
      // Cache the user
      userCache[cacheKey] = {
        user: formattedUser,
        timestamp: Date.now()
      };
      
      logger.debug(`Caching user data for ID: ${payload.id}`);
      
      return formattedUser;
    }

    return user as User | null;
  } catch (error) {
    logger.error('Error getting current user:', error)
    return null
  }
}

/**
 * Hash a password using bcrypt with enhanced security
 */
export async function hashPassword(password: string): Promise<string> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
  
  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password using bcrypt with rate limiting to prevent timing attacks
 */
export async function verifyPassword(password: string, hash: string, ip: string = 'unknown'): Promise<boolean> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
  
  logger.debug('Starting password verification', { ip });
  
  try {
    // Check rate limiting
    logger.debug('Checking rate limiting', { ip });
    if (isRateLimited(ip)) {
      logger.warn(`Password verification rate limited for IP: ${ip}`);
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return false;
    }
    
    // Add additional validation to prevent errors
    logger.debug('Validating password and hash', { 
      ip, 
      hasPassword: password !== undefined && password !== null,
      hasHash: hash !== undefined && hash !== null,
      passwordType: typeof password,
      hashType: typeof hash
    });
    
    if (password === undefined || password === null) {
      logger.warn('Missing password for verification', { ip });
      recordFailedAttempt(ip);
      return false;
    }
    
    if (hash === undefined || hash === null) {
      logger.warn('Missing hash for verification', { ip });
      recordFailedAttempt(ip);
      return false;
    }
    
    // Check for empty strings
    if (password === '') {
      logger.warn('Empty password for verification', { ip });
      recordFailedAttempt(ip);
      return false;
    }
    
    if (hash === '') {
      logger.warn('Empty hash for verification', { ip });
      recordFailedAttempt(ip);
      return false;
    }
    
    logger.debug('Calling bcrypt.compare', { ip });
    const isValid = await bcrypt.compare(password, hash);
    logger.debug('bcrypt.compare completed', { ip, isValid });
    
    // Record failed attempts
    if (!isValid) {
      logger.debug('Password invalid, recording failed attempt', { ip });
      recordFailedAttempt(ip);
    }
    
    logger.debug('Password verification completed', { ip, isValid });
    return isValid;
  } catch (error: any) {
    logger.error('Password verification error:', { 
      error: error.message, 
      stack: error.stack,
      ip 
    });
    recordFailedAttempt(ip);
    return false;
  }
}

// Cleanup function to clear expired cache entries periodically
function cleanupUserCache() {
  const now = Date.now();
  let cleanedEntries = 0;
  
  // Use Array.from to safely iterate over the object properties
  const entries = Object.entries(userCache);
  for (const [key, cachedItem] of entries) {
    if (cachedItem && (now - cachedItem.timestamp) >= CACHE_TTL) {
      delete userCache[key];
      cleanedEntries++;
    }
  }
  
  if (cleanedEntries > 0) {
    logger.debug(`Cleaned ${cleanedEntries} expired user cache entries`);
  }
}

// Cleanup function to clear expired rate limiter entries
function cleanupRateLimiter() {
  const now = Date.now();
  let cleanedEntries = 0;
  
  // Use Array.from to safely iterate over the Map entries
  const entries = Array.from(rateLimiter.entries());
  for (const [key, record] of entries) {
    if (record && (now - record.lastAttempt) >= LOCKOUT_TIME) {
      rateLimiter.delete(key);
      cleanedEntries++;
    }
  }
  
  if (cleanedEntries > 0) {
    logger.debug(`Cleaned ${cleanedEntries} expired rate limiter entries`);
  }
}

// Run cache cleanup every 10 minutes
let userCacheCleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === 'undefined') {
  // Only run on server side
  userCacheCleanupInterval = setInterval(cleanupUserCache, 10 * 60 * 1000);
}

// Run rate limiter cleanup every 15 minutes
let rateLimiterCleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === 'undefined') {
  // Only run on server side
  rateLimiterCleanupInterval = setInterval(cleanupRateLimiter, 15 * 60 * 1000);
}

// Cleanup functions to clear the intervals
export function cleanupAuthIntervals() {
  if (userCacheCleanupInterval) {
    clearInterval(userCacheCleanupInterval);
    userCacheCleanupInterval = null;
  }
  if (rateLimiterCleanupInterval) {
    clearInterval(rateLimiterCleanupInterval);
    rateLimiterCleanupInterval = null;
  }
}

// Cleanup function to disconnect the database when needed
export async function cleanupAuth() {
  if (typeof window === 'undefined') {
    // Server-side only
    try {
      // Don't disconnect the shared db instance here as it's managed in db.ts
      // This prevents connection churn which can lead to "too many clients" errors
    } catch (error) {
      logger.error('Error in auth cleanup:', error);
    }
  }
}