import { useCurrentUser } from './useApi';
import { hasPermission, hasAnyPermission, UserRole, ResourceType, PermissionAction } from '@/lib/permissions';

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions
 */
export function usePermissions() {
  const { data: user } = useCurrentUser();
  const userRole = (user?.role as UserRole) || 'user';

  /**
   * Check if the current user has permission to perform an action on a resource
   */
  const checkPermission = (
    resource: ResourceType,
    action: PermissionAction
  ) => {
    return hasPermission(userRole, resource, action);
  };

  /**
   * Check if the current user has any of the specified permissions
   */
  const checkAnyPermission = (
    resource: ResourceType,
    actions: PermissionAction[]
  ) => {
    return hasAnyPermission(userRole, resource, actions);
  };

  return {
    userRole,
    checkPermission,
    checkAnyPermission,
    // Convenience methods for common resources
    canViewUsers: () => checkPermission('users', 'view'),
    canCreateUsers: () => checkPermission('users', 'create'),
    canEditUsers: () => checkPermission('users', 'edit'),
    canDeleteUsers: () => checkPermission('users', 'delete'),
    canBulkDeleteUsers: () => checkPermission('users', 'bulkDelete'),
    
    canViewTenants: () => checkPermission('tenants', 'view'),
    canCreateTenants: () => checkPermission('tenants', 'create'),
    canEditTenants: () => checkPermission('tenants', 'edit'),
    canDeleteTenants: () => checkPermission('tenants', 'delete'),
    canBulkDeleteTenants: () => checkPermission('tenants', 'bulkDelete'),
    
    canViewAssets: () => checkPermission('assets', 'view'),
    canCreateAssets: () => checkPermission('assets', 'create'),
    canEditAssets: () => checkPermission('assets', 'edit'),
    canDeleteAssets: () => checkPermission('assets', 'delete'),
    canBulkDeleteAssets: () => checkPermission('assets', 'bulkDelete'),
    
    canViewSettings: () => checkPermission('settings', 'view'),
    canEditSettings: () => checkPermission('settings', 'edit'),
  };
}