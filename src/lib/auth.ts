import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SALT_ROUNDS = 10

export interface UserJwtPayload {
  id: string
  email: string
  tenantId: string
  role: string
  exp: number
}

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
    { expiresIn: '24h' }
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
export async function getCurrentUser(request: NextRequest) {
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

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: { tenant: true }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password using bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}