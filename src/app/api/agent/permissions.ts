import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, errorResponse } from '@/lib/api-utils'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger'

// Types for agent permissions
export type AgentPermissionAction = 'submitData' | 'viewStatus' | 'healthCheck'

// Check if user has permission to access agent API
export async function checkAgentPermission(request: NextRequest, action: AgentPermissionAction) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return { authorized: false, response: unauthorizedResponse() }
    }

    // For health check, allow any authenticated user
    if (action === 'healthCheck') {
      return { authorized: true, user }
    }

    // Check if user has roleId
    if (!user.roleId) {
      return { 
        authorized: false, 
        response: errorResponse('User role not found', 403) 
      }
    }

    // For submitData and viewStatus, check specific permissions
    const hasAgentPermission = await hasPermission(
      user.roleId,
      user.tenantId,
      'agent',
      action
    )

    if (!hasAgentPermission) {
      return { 
        authorized: false, 
        response: errorResponse('Forbidden: Insufficient permissions to access agent API', 403) 
      }
    }

    return { authorized: true, user }
  } catch (error: any) {
    logger.error('Error checking agent permission:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    })
    
    return { 
      authorized: false, 
      response: errorResponse('Failed to check permissions. Please try again later.') 
    }
  }
}