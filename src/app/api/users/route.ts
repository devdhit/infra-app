import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'
import { validateEmail, validatePassword } from '@/lib/security'
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

    // Validate email format using enhanced validation
    if (!validateEmail(body.email)) {
      return errorResponse('Invalid email format', 400)
    }

    // Validate password strength using enhanced validation
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.isValid) {
      return errorResponse(passwordValidation.message, 400);
    }

    // Determine the tenant ID for the new user
    // Only admins can create users for other tenants
    const userTenantId = currentRoleName === 'admin' && body.tenantId ? body.tenantId : currentUser.tenantId;
    
    // Handle case when role is not provided - default to 'user'
    let roleId = body.roleId;
    
    // If no roleId provided, try to find the default 'user' role
    if (!roleId) {
      const defaultRole = await db.role.findFirst({
        where: {
          name: 'user',
          tenantId: userTenantId
        }
      })
      
      if (defaultRole) {
        roleId = defaultRole.id;
      } else {
        // If no default 'user' role exists, use the first available role
        const firstRole = await db.role.findFirst({
          where: {
            tenantId: userTenantId
          }
        })
        
        if (firstRole) {
          roleId = firstRole.id;
        } else {
          return errorResponse('No roles found for this tenant', 400)
        }
      }
    }

    // Validate role
    if (roleId) {
      // Verify the role exists
      const role = await db.role.findUnique({
        where: {
          id: roleId
        }
      })

      if (!role) {
        return errorResponse('Invalid role specified', 400)
      }

      // Verify the role belongs to the correct tenant
      if (role.tenantId !== userTenantId) {
        return errorResponse('Invalid role for this tenant', 400)
      }

      const hashedPassword = await hashPassword(body.password);
      
      // Create user with error handling
      try {
        const user = await db.user.create({
          data: {
            email: body.email,
            name: body.name,
            password: hashedPassword,
            roleId: roleId,
            tenantId: userTenantId
          }
        })

        // Remove password from response and include role relation
        const { password, roleId: userRoleId, ...userWithoutPassword } = user
        const userWithRole = {
          ...userWithoutPassword,
          role: role
        }

        return successResponse(userWithRole, 201)
      } catch (createError: any) {
        // Handle specific database errors
        if (createError.code === 'P2002') {
          // Unique constraint violation
          return errorResponse('A user with this email already exists', 409)
        } else if (createError.code === 'P2003') {
          // Foreign key constraint violation
          return errorResponse('Invalid reference data provided', 400)
        } else {
          // Generic error for other database issues
          logger.error('Error creating user:', createError)
          return errorResponse('Failed to create user due to a database error', 500)
        }
      }
    }
    
    return errorResponse('Failed to create user - no valid role found', 400)
  } catch (error: any) {
    logger.error('Error creating user:', error)
    // Don't expose internal error details
    return errorResponse('Failed to create user due to a server error', 500)
  }
}
