// Only import and use PrismaClient on the server side
import { db } from './db';

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserJwtPayload, User } from '@/types/users'

// Use environment-specific JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
const SALT_ROUNDS = 10

// Token expiration based on environment
const TOKEN_EXPIRATION = process.env.NODE_ENV === 'production' ? '24h' : '7d'

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: { id: string; email: string; tenantId: string; role: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  )
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): UserJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJwtPayload
  } catch (error) {
    return null
  }
}

/**
 * Get the current user from the request
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
    if (payload.exp * 1000 < Date.now()) return null

    // Fetch user from database with role relation
    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: { tenant: true, role: true }
    })

    // If user exists, convert the role permissions from JsonValue to Record<string, string[]>
    // and convert Date objects to strings
    if (user && user.role) {
      return {
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
    }

    // Convert Date objects to strings for users without roles
    if (user) {
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        tenant: user.tenant ? {
          ...user.tenant,
          createdAt: user.tenant.createdAt.toISOString(),
          updatedAt: user.tenant.updatedAt.toISOString()
        } : null
      } as User;
    }

    return user as User | null;
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
  
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password using bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Prevent running on the browser
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called on the server side');
  }
  
  return await bcrypt.compare(password, hash)
}

// Cleanup function to disconnect the database when needed
export async function cleanupAuth() {
  if (typeof window === 'undefined') {
    // Server-side only
    try {
      // Don't disconnect the shared db instance here as it's managed in db.ts
      // This prevents connection churn which can lead to "too many clients" errors
    } catch (error) {
      console.error('Error in auth cleanup:', error);
    }
  }
}