import { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/auth'

// POST route to check permissions
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request)
    
    if (!user || !user.role?.id || !user.tenantId) {
      return Response.json({ hasPermission: false }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { resource, action } = body
    
    if (!resource || !action) {
      return Response.json({ error: 'Resource and action are required' }, { status: 400 })
    }
    
    // Check permission on the server side
    const permission = await hasPermission(user.role.id, user.tenantId, resource, action)
    
    return Response.json({ hasPermission: permission })
  } catch (error) {
    console.error('Error checking permissions:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}