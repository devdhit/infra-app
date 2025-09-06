import { useCurrentUser } from './useApi';
import { ResourceType, PermissionAction } from '@/lib/permissions';
import { api } from '@/lib/api';
import { useCallback } from 'react';

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions
 */
export function usePermissions() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  /**
   * Check if the current user has permission to perform an action on a resource
   */
  const checkPermission = useCallback(async (
    resource: ResourceType,
    action: PermissionAction
  ) => {
    // Prevent running on the server or when user data is not available
    if (typeof window === 'undefined' || !user || !user.role?.id || !user.tenantId || isUserLoading) {
      return false;
    }
    
    try {
      // Make API call to check permissions using the authenticated API client
      const response = await api.post<{
        hasPermission: boolean;
      }, {
        roleId: string;
        tenantId: string;
        resource: ResourceType;
        action: PermissionAction;
      }>(`/permissions/check`, {
        roleId: user.role.id, // Use role ID, not role name
        tenantId: user.tenantId,
        resource,
        action
      });
      
      return response.hasPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }, [user, isUserLoading]);

  /**
   * Check if the current user has any of the specified permissions
   */
  const checkAnyPermission = useCallback(async (
    resource: ResourceType,
    actions: PermissionAction[]
  ) => {
    // Prevent running on the server or when user data is not available
    if (typeof window === 'undefined' || !user || !user.role?.id || !user.tenantId || isUserLoading) {
      return false;
    }
    
    for (const action of actions) {
      if (await checkPermission(resource, action)) {
        return true;
      }
    }
    return false;
  }, [user, isUserLoading, checkPermission]);

  // Get user role name, defaulting to 'user' if not available
  const userRole = user?.role?.name || 'user';

  // Memoize all permission checking functions with additional guards
  const canViewUsers = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('users', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateUsers = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('users', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditUsers = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('users', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteUsers = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('users', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteUsers = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('users', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewTenants = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('tenants', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateTenants = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('tenants', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditTenants = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('tenants', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteTenants = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('tenants', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteTenants = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('tenants', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewAssets = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('assets', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateAssets = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('assets', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditAssets = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('assets', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteAssets = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('assets', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteAssets = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('assets', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  // Asset-specific permissions
  const canViewPC = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('pc', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreatePC = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('pc', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditPC = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('pc', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeletePC = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('pc', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeletePC = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('pc', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewLaptop = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('laptop', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateLaptop = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('laptop', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditLaptop = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('laptop', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteLaptop = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('laptop', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteLaptop = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('laptop', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewPrinter = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('printer', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreatePrinter = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('printer', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditPrinter = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('printer', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeletePrinter = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('printer', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeletePrinter = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('printer', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewLicense = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('license', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateLicense = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('license', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditLicense = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('license', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteLicense = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('license', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteLicense = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('license', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewWarehouse = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('warehouse', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateWarehouse = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('warehouse', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditWarehouse = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('warehouse', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteWarehouse = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('warehouse', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteWarehouse = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('warehouse', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewInternet = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('internet', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateInternet = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('internet', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditInternet = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('internet', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteInternet = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('internet', 'delete');
  }, [user, isUserLoading, checkPermission]);
  
  const canBulkDeleteInternet = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('internet', 'bulkDelete');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewSettings = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('settings', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditSettings = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('settings', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canViewRoles = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('roles', 'view');
  }, [user, isUserLoading, checkPermission]);
  
  const canCreateRoles = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('roles', 'create');
  }, [user, isUserLoading, checkPermission]);
  
  const canEditRoles = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('roles', 'edit');
  }, [user, isUserLoading, checkPermission]);
  
  const canDeleteRoles = useCallback(() => {
    if (isUserLoading || !user || !user.role?.id || !user.tenantId) {
      return Promise.resolve(false);
    }
    return checkPermission('roles', 'delete');
  }, [user, isUserLoading, checkPermission]);

  return {
    userRole,
    checkPermission,
    checkAnyPermission,
    // Convenience methods for common resources
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canBulkDeleteUsers,
    
    canViewTenants,
    canCreateTenants,
    canEditTenants,
    canDeleteTenants,
    canBulkDeleteTenants,
    
    canViewAssets,
    canCreateAssets,
    canEditAssets,
    canDeleteAssets,
    canBulkDeleteAssets,
    
    // Asset-specific permissions
    canViewPC,
    canCreatePC,
    canEditPC,
    canDeletePC,
    canBulkDeletePC,
    
    canViewLaptop,
    canCreateLaptop,
    canEditLaptop,
    canDeleteLaptop,
    canBulkDeleteLaptop,
    
    canViewPrinter,
    canCreatePrinter,
    canEditPrinter,
    canDeletePrinter,
    canBulkDeletePrinter,
    
    canViewLicense,
    canCreateLicense,
    canEditLicense,
    canDeleteLicense,
    canBulkDeleteLicense,
    
    canViewWarehouse,
    canCreateWarehouse,
    canEditWarehouse,
    canDeleteWarehouse,
    canBulkDeleteWarehouse,
    
    canViewInternet,
    canCreateInternet,
    canEditInternet,
    canDeleteInternet,
    canBulkDeleteInternet,
    
    canViewSettings,
    canEditSettings,
    
    canViewRoles,
    canCreateRoles,
    canEditRoles,
    canDeleteRoles,
  };
}