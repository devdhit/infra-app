import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/users - Get all users (requires view permission)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to view users
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'users',
      'view'
    )

    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Regular users can only see users in their own tenant
    // Admins can see all users (no tenant filter)
    const userRoleName = user.role?.name || 'user';
    const whereClause = userRoleName === 'admin' 
      ? {} 
      : { tenantId: user.tenantId };

    const users = await db.user.findMany({
      where: whereClause,
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

// POST /api/users - Create a new user (requires create permission)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to create users
    const hasCreatePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'create'
    )

    if (!hasCreatePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get role name from the related Role object, default to 'user'
    const currentRoleName = currentUser.role?.name || 'user';

    // Only admins can create users for other tenants
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return new Response(JSON.stringify({ error: 'Email, name, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate password length
    if (body.password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle case when role is not provided - default to 'user'
    if (!body.role) {
      body.role = 'user';
    }

    // Validate role if provided
    if (body.role) {
      // Find the role by name within the same tenant
      const role = await db.role.findFirst({
        where: {
          name: body.role,
          tenantId: currentRoleName === 'admin' && body.tenantId ? body.tenantId : currentUser.tenantId
        }
      })

      if (!role) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
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
          roleId: role.id,
          tenantId: currentRoleName === 'admin' && body.tenantId ? body.tenantId : currentUser.tenantId
        }
      })

      // Remove password from response and include role relation
      const { password, roleId, ...userWithoutPassword } = user
      const userWithRole = {
        ...userWithoutPassword,
        role: role
      }

      return new Response(JSON.stringify(userWithRole), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // This should not be reached, but adding a fallback return for type safety
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/users/[id] - Update a user (requires edit permission)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to edit users
    const hasEditPermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'edit'
    )

    if (!hasEditPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const userId = resolvedParams.id

    // Validate user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check tenant access - users can only edit users in their own tenant unless they're admin
    const currentRoleName = currentUser.role?.name || 'user'
    if (currentRoleName !== 'admin' && existingUser.tenantId !== currentUser.tenantId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prepare update data
    const updateData: any = {
      email: body.email,
      name: body.name,
      tenantId: body.tenantId || existingUser.tenantId
    }

    // Handle password update if provided
    if (body.password) {
      if (body.password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      updateData.password = await hashPassword(body.password)
    }

    // Handle role update if provided
    if (body.role) {
      // Find the role by name within the same tenant
      const role = await db.role.findFirst({
        where: {
          name: body.role,
          tenantId: currentRoleName === 'admin' && body.tenantId ? body.tenantId : currentUser.tenantId
        }
      })

      if (!role) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      updateData.roleId = role.id
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true }
    })

    // Remove password from response
    const { password, roleId, ...userWithoutPassword } = updatedUser
    const userWithRole = {
      ...userWithoutPassword,
      role: updatedUser.role
    }

    return new Response(JSON.stringify(userWithRole), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// DELETE /api/users/[id] - Delete a user (requires delete permission)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if user has permission to delete users
    const hasDeletePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'delete'
    )

    if (!hasDeletePermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = resolvedParams.id

    // Validate user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check tenant access - users can only delete users in their own tenant unless they're admin
    const currentRoleName = currentUser.role?.name || 'user'
    if (currentRoleName !== 'admin' && existingUser.tenantId !== currentUser.tenantId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prevent users from deleting themselves
    if (existingUser.id === currentUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await db.user.delete({
      where: { id: userId }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}