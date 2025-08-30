import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { generateToken, verifyPassword } from '@/lib/auth'
import { cookies } from 'next/headers'

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: body.email },
      include: { tenant: true }
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify password
    const isPasswordValid = await verifyPassword(body.password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    })

    // Set token in cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'strict',
    })

    // Return user data (without password)
    const { password, ...userWithoutPassword } = user

    return new Response(JSON.stringify({
      user: userWithoutPassword,
      token
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error during login:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/auth/logout - User logout
export async function DELETE() {
  try {
    // Clear token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token')

    return new Response(null, {
      status: 204
    })
  } catch (error) {
    console.error('Error during logout:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}