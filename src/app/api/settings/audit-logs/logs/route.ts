import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/settings/audit-logs/logs - Get audit logs for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to view audit logs
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'auditLogs',
      'view'
    );
    
    if (!hasViewPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const modelType = searchParams.get('modelType') || undefined;
    const action = searchParams.get('action') || undefined;
    const userId = searchParams.get('userId') || undefined;

    // Get audit logs settings to check if audit logging is enabled
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId: user.tenantId
      }
    });

    // If audit logging is disabled, return empty results
    if (auditLogsSettings && !auditLogsSettings.enabled) {
      return new Response(JSON.stringify({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build where clause for filtering
    const where: any = {
      tenantId: user.tenantId
    };

    // Add model type filter if specified
    if (modelType) {
      where.modelType = modelType;
    }

    // Add action filter if specified
    if (action) {
      where.action = action;
    }

    // Add user filter if specified
    if (userId) {
      where.userId = userId;
    }

    // Get audit logs with pagination
    const [auditLogs, total] = await Promise.all([
      db.history.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: {
                select: {
                  name: true,
                  permissions: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.history.count({ where })
    ]);

    // Enhance audit logs with additional role information
    const enhancedAuditLogs = auditLogs.map(log => {
      // Ensure changes is an object before processing
      if (typeof log.changes !== 'object' || log.changes === null) {
        return log;
      }

      // If this is a role update, add more detailed permission information
      if (log.modelType === 'Role' && log.action === 'update') {
        // Add a summary of permission changes to the changes object
        if ('permissions' in log.changes && log.changes.permissions) {
          const permissions = log.changes.permissions as Record<string, string[]>;
          const permissionCount = Object.keys(permissions).length;
          
          return {
            ...log,
            changes: {
              ...log.changes,
              permissionSummary: {
                count: permissionCount,
                resources: Object.keys(permissions)
              }
            }
          };
        }
        
        // Handle detailed permission changes
        if ('permissionChanges' in log.changes && log.changes.permissionChanges) {
          const permissionChanges = log.changes.permissionChanges as {
            added?: Record<string, string[]>;
            removed?: Record<string, string[]>;
            modified?: Record<string, { added: string[]; removed: string[] }>;
          };
          
          const allResources = {
            ...(permissionChanges.added || {}),
            ...(permissionChanges.removed || {}),
            ...(permissionChanges.modified || {})
          };
          
          return {
            ...log,
            changes: {
              ...log.changes,
              permissionSummary: {
                count: Object.keys(allResources).length,
                resources: Object.keys(allResources)
              }
            }
          };
        }
      }
      
      // If this is a user update that involves role changes, fetch role details
      if (log.modelType === 'User' && log.action === 'update' && 'roleId' in log.changes) {
        return {
          ...log,
          changes: {
            ...log.changes,
            roleDetails: {
              id: (log.changes as any).roleId,
              name: 'Role information not available in audit log'
            }
          }
        };
      }
      
      return log;
    });

    return new Response(JSON.stringify({
      data: enhancedAuditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}