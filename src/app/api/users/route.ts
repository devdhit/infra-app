import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// GET /api/users - Get all users (requires view permission)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user has permission to view users
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'users',
      'view'
    )

    if (!hasViewPermission) {
      return errorResponse('Forbidden', 403)
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

    return successResponse(users)
  } catch (error) {
    logger.error('Error fetching users:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/users - Create a new user (requires create permission)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Check if user has permission to create users
    const hasCreatePermission = await hasPermission(
      currentUser.role?.id || '',
      currentUser.tenantId,
      'users',
      'create'
    )

    if (!hasCreatePermission) {
      return errorResponse('Forbidden', 403)
    }

    // Get role name from the related Role object, default to 'user'
    const currentRoleName = currentUser.role?.name || 'user';

    // Only admins can create users for other tenants
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return errorResponse('Email, name, and password are required', 400)
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse('Invalid email format', 400)
    }

    // Validate password length
    if (body.password.length < 6) {
      return errorResponse('Password must be at least 6 characters long', 400)
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
        return errorResponse('Role not found', 400)
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

      return successResponse(userWithRole, 201)
    }
    
    // This should not be reached, but adding a fallback return for type safety
    return errorResponse('Failed to create user')
  } catch (error: any) {
    logger.error('Error creating user:', error)
    return errorResponse('Internal server error')
  }
}