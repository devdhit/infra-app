import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse, 
  badRequestResponse 
} from '@/lib/api-utils'
import { generateToken, verifyPassword } from '@/lib/auth'

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
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

    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })

    // Check if user exists
    if (!user) {
      return errorResponse('Invalid email or password', 401)
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 401)
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    })

    // Return success response with token and user data
    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    })
  } catch (error) {
    console.error('Error in login route:', error)
    return errorResponse('Internal server error')
  }
}