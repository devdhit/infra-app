import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// GET /api/users - Get all users (admin) or users in same tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const users = await db.user.findMany({
      where: {
        tenantId: user.role === 'admin' ? undefined : user.tenantId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Only admins can create users for other tenants
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return new Response(JSON.stringify({ error: 'Email, name, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const hashedPassword = await hashPassword(body.password);
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || 'user',
        tenantId: currentUser.role === 'admin' && body.tenantId ? body.tenantId : currentUser.tenantId
      }
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return new Response(JSON.stringify(userWithoutPassword), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}