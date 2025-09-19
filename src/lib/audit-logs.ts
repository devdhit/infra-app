import { db } from './db'
import { HistoryRecord, createHistoryRecord } from './history'

/**
 * Creates an audit log entry if audit logging is enabled for the tenant and the specific action
 * @param tenantId - The tenant ID
 * @param historyRecord - The history record to create
 * @param actionType - The type of action being logged (create, update, delete, bulkDelete, import, export)
 * @returns The created history record or null if logging is disabled
 */
export async function createAuditLog(
  tenantId: string,
  historyRecord: HistoryRecord,
  actionType: 'create' | 'update' | 'delete' | 'bulkDelete' | 'import' | 'export'
): Promise<any | null> {
  try {
    // Get audit logs settings for the tenant
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId
      }
    });

    // If no settings exist or audit logging is disabled, don't create audit log
    if (!auditLogsSettings || !auditLogsSettings.enabled) {
      return null;
    }

    // Check if logging is enabled for this specific action type
    let shouldLog = false;
    switch (actionType) {
      case 'create':
        shouldLog = auditLogsSettings.logAssetCreation;
        break;
      case 'update':
        shouldLog = auditLogsSettings.logAssetUpdates;
        break;
      case 'delete':
        shouldLog = auditLogsSettings.logAssetDeletion;
        break;
      case 'bulkDelete':
        // For now, use the same setting as delete
        shouldLog = auditLogsSettings.logAssetDeletion;
        break;
      case 'import':
        // For now, use the same setting as create
        shouldLog = auditLogsSettings.logAssetCreation;
        break;
      case 'export':
        // For now, use the same setting as view (we'll log exports as a special type)
        shouldLog = true; // Always log exports for security reasons
        break;
      default:
        shouldLog = true; // Log by default if action type is unknown
    }

    // If logging is disabled for this action type, don't create audit log
    if (!shouldLog) {
      return null;
    }

    // Create the audit log entry
    const auditLog = await createHistoryRecord(historyRecord);
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error as audit logging failure shouldn't break the main functionality
    return null;
  }
}

/**
 * Creates a user login/logout audit log entry if enabled
 * @param tenantId - The tenant ID
 * @param historyRecord - The history record to create
 * @param eventType - The type of event being logged (login, logout)
 * @returns The created history record or null if logging is disabled
 */
export async function createUserEventAuditLog(
  tenantId: string,
  historyRecord: HistoryRecord,
  eventType: 'login' | 'logout'
): Promise<any | null> {
  try {
    // Get audit logs settings for the tenant
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId
      }
    });

    // If no settings exist or audit logging is disabled, don't create audit log
    if (!auditLogsSettings || !auditLogsSettings.enabled) {
      return null;
    }

    // Check if logging is enabled for this specific event type
    let shouldLog = false;
    switch (eventType) {
      case 'login':
        shouldLog = auditLogsSettings.logUserLogin;
        break;
      case 'logout':
        shouldLog = auditLogsSettings.logUserLogout;
        break;
      default:
        shouldLog = true; // Log by default if event type is unknown
    }

    // If logging is disabled for this event type, don't create audit log
    if (!shouldLog) {
      return null;
    }

    // Create the audit log entry
    const auditLog = await createHistoryRecord(historyRecord);
    
    return auditLog;
  } catch (error) {
    console.error('Error creating user event audit log:', error);
    // Don't throw error as audit logging failure shouldn't break the main functionality
    return null;
  }
}

/**
 * Creates a permission change audit log entry if enabled
 * @param tenantId - The tenant ID
 * @param historyRecord - The history record to create
 * @returns The created history record or null if logging is disabled
 */
export async function createPermissionAuditLog(
  tenantId: string,
  historyRecord: HistoryRecord
): Promise<any | null> {
  try {
    // Get audit logs settings for the tenant
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId
      }
    });

    // If no settings exist or audit logging is disabled, don't create audit log
    if (!auditLogsSettings || !auditLogsSettings.enabled) {
      return null;
    }

    // Check if logging is enabled for permission changes
    const shouldLog = auditLogsSettings.logPermissionChanges;

    // If logging is disabled for permission changes, don't create audit log
    if (!shouldLog) {
      return null;
    }

    // Create the audit log entry
    const auditLog = await createHistoryRecord(historyRecord);
    
    return auditLog;
  } catch (error) {
    console.error('Error creating permission audit log:', error);
    // Don't throw error as audit logging failure shouldn't break the main functionality
    return null;
  }
}

/**
 * Creates a role update audit log entry with detailed permission information
 * @param tenantId - The tenant ID
 * @param historyRecord - The history record to create
 * @param oldPermissions - The old permissions before the update
 * @param newPermissions - The new permissions after the update
 * @returns The created history record or null if logging is disabled
 */
export async function createRoleUpdateAuditLog(
  tenantId: string,
  historyRecord: HistoryRecord,
  oldPermissions: Record<string, string[]>,
  newPermissions: Record<string, string[]>
): Promise<any | null> {
  try {
    // Get audit logs settings for the tenant
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId
      }
    });

    // If no settings exist or audit logging is disabled, don't create audit log
    if (!auditLogsSettings || !auditLogsSettings.enabled) {
      return null;
    }

    // Check if logging is enabled for permission changes
    const shouldLog = auditLogsSettings.logPermissionChanges;

    // If logging is disabled for permission changes, don't create audit log
    if (!shouldLog) {
      return null;
    }

    // Enhance the changes with detailed permission comparison
    const enhancedChanges = {
      ...historyRecord.changes,
      permissionChanges: {
        added: {} as Record<string, string[]>,
        removed: {} as Record<string, string[]>,
        modified: {} as Record<string, { added: string[], removed: string[] }>
      }
    };

    // Compare old and new permissions
    const allResources = new Set([
      ...Object.keys(oldPermissions),
      ...Object.keys(newPermissions)
    ]);

    // Convert Set to Array for iteration to avoid TypeScript errors
    const resourcesArray = Array.from(allResources);
    for (const resource of resourcesArray) {
      const oldActions = oldPermissions[resource] || [];
      const newActions = newPermissions[resource] || [];

      // Check if resource was added
      if (!oldPermissions[resource] && newPermissions[resource]) {
        enhancedChanges.permissionChanges.added[resource] = newActions;
      }
      // Check if resource was removed
      else if (oldPermissions[resource] && !newPermissions[resource]) {
        enhancedChanges.permissionChanges.removed[resource] = oldActions;
      }
      // Check if resource was modified
      else if (oldPermissions[resource] && newPermissions[resource]) {
        const addedActions = newActions.filter(action => !oldActions.includes(action));
        const removedActions = oldActions.filter(action => !newActions.includes(action));

        if (addedActions.length > 0 || removedActions.length > 0) {
          enhancedChanges.permissionChanges.modified[resource] = {
            added: addedActions,
            removed: removedActions
          };
        }
      }
    }

    // Update the history record with enhanced changes
    const enhancedHistoryRecord = {
      ...historyRecord,
      changes: enhancedChanges
    };

    // Create the audit log entry
    const auditLog = await createHistoryRecord(enhancedHistoryRecord);
    
    return auditLog;
  } catch (error) {
    console.error('Error creating role update audit log:', error);
    // Don't throw error as audit logging failure shouldn't break the main functionality
    return null;
  }
}