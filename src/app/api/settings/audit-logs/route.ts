import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger';

// GET /api/settings/audit-logs - Get audit logs settings for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to view settings
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'view'
    )
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Try to get existing audit logs settings
    let auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId: user.tenantId
      }
    })

    // If no settings exist, create default settings
    if (!auditLogsSettings) {
      auditLogsSettings = await db.auditLogsSettings.create({
        data: {
          tenantId: user.tenantId,
          enabled: true,
          retentionPeriod: 90, // days
          logAssetCreation: true,
          logAssetUpdates: true,
          logAssetDeletion: true,
          logUserLogin: true,
          logUserLogout: true,
          logPermissionChanges: true,
          notifyOnCriticalEvents: true,
          emailNotifications: true,
          slackNotifications: false,
          notificationEmail: user.email,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return new Response(JSON.stringify(auditLogsSettings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logger.error('Error fetching audit logs settings:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/settings/audit-logs - Update audit logs settings for the user's tenant
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to edit settings
    const hasEditPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'edit'
    )
    
    if (!hasEditPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()

    // Validate retention period
    if (body.retentionPeriod !== undefined && (body.retentionPeriod < 1 || body.retentionPeriod > 3650)) {
      return new Response(JSON.stringify({ 
        error: 'Retention period must be between 1 and 3650 days' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate email if provided
    if (body.notificationEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (body.notificationEmail && !emailRegex.test(body.notificationEmail)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid email format' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Update or create audit logs settings
    const auditLogsSettings = await db.auditLogsSettings.upsert({
      where: {
        tenantId: user.tenantId
      },
      update: {
        ...body,
        updatedAt: new Date()
      },
      create: {
        tenantId: user.tenantId,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return new Response(JSON.stringify(auditLogsSettings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating audit logs settings:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}