import { useCurrentUser } from './useApi';
import { ResourceType, PermissionAction } from '@/lib/permissions';
import { api } from '@/lib/api';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { User } from '@/types/users';

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions
 */
export function usePermissions() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser() as { data: User | undefined; isLoading: boolean };
  const isMountedRef = useRef(true);
  
  // Cache for permission results to avoid redundant API calls
  const permissionCache = useRef<Record<string, boolean>>({});
  
  // Timestamp for cache invalidation (5 minutes)
  const cacheTimestamp = useRef<number>(Date.now());
  
  // Reset cache every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        cacheTimestamp.current = Date.now();
        permissionCache.current = {};
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Clean up ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Check if the current user has permission to perform an action on a resource
   */
  const checkPermission = useCallback(async (
    resource: ResourceType,
    action: PermissionAction
  ): Promise<boolean> => {
    // Prevent running on the server or when user data is not available
    if (typeof window === 'undefined') {
      return false;
    }
    
    if (!user) {
      return false;
    }
    
    if (!user.role?.id) {
      return false;
    }
    
    if (!user.tenantId) {
      return false;
    }
    
    // Create cache key
    const cacheKey = `${user.role.id}-${user.tenantId}-${resource}-${action}`;
    
    // Check if result is cached and not expired
    if (permissionCache.current[cacheKey] !== undefined) {
      return permissionCache.current[cacheKey];
    }
    
    try {
      // Make API call to check permissions using the authenticated API client
      // The API will use the current user's role and tenant ID
      const response = await api.post<{
        hasPermission: boolean;
      }, {
        resource: ResourceType;
        action: PermissionAction;
      }>(`/permissions/check`, {
        resource,
        action
      });
      
      // Cache the result
      if (isMountedRef.current) {
        permissionCache.current[cacheKey] = response.hasPermission;
      }
      
      return response.hasPermission;
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking permissions:', error);
      }
      return false;
    }
  }, [user]);

  /**
   * Check if the current user has any of the specified permissions
   */
  const checkAnyPermission = useCallback(async (
    resource: ResourceType,
    actions: PermissionAction[]
  ): Promise<boolean> => {
    // Prevent running on the server or when user data is not available
    if (typeof window === 'undefined' || !user || !user.role?.id || !user.tenantId) {
      return false;
    }
    
    // Check cache for any of the permissions
    for (const action of actions) {
      const cacheKey = `${user.role.id}-${user.tenantId}-${resource}-${action}`;
      if (permissionCache.current[cacheKey] === true) {
        return true;
      }
    }
    
    for (const action of actions) {
      if (await checkPermission(resource, action)) {
        return true;
      }
    }
    return false;
  }, [user, checkPermission]);

  // Get user role name, defaulting to 'user' if not available
  const userRole = user?.role?.name || 'user';

  // Create a factory function for permission checkers that can be used with useCallback
  const createPermissionChecker = useCallback((resource: ResourceType, action: PermissionAction) => {
    return async (): Promise<boolean> => {
      // If still loading user data, return false to prevent unauthorized access
      if (isUserLoading) {
        return false;
      }
      
      // If user data is not available, return false
      if (!user || !user.role?.id || !user.tenantId) {
        return false;
      }
      
      // Check actual permission
      return await checkPermission(resource, action);
    };
  }, [user, isUserLoading, checkPermission]);

  // Create permission checking functions using useMemo to avoid recreating them on every render
  const canViewUsers = useMemo(() => createPermissionChecker('users', 'view'), [createPermissionChecker]);
  const canCreateUsers = useMemo(() => createPermissionChecker('users', 'create'), [createPermissionChecker]);
  const canEditUsers = useMemo(() => createPermissionChecker('users', 'edit'), [createPermissionChecker]);
  const canDeleteUsers = useMemo(() => createPermissionChecker('users', 'delete'), [createPermissionChecker]);
  const canBulkDeleteUsers = useMemo(() => createPermissionChecker('users', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewTenants = useMemo(() => createPermissionChecker('tenants', 'view'), [createPermissionChecker]);
  const canCreateTenants = useMemo(() => createPermissionChecker('tenants', 'create'), [createPermissionChecker]);
  const canEditTenants = useMemo(() => createPermissionChecker('tenants', 'edit'), [createPermissionChecker]);
  const canDeleteTenants = useMemo(() => createPermissionChecker('tenants', 'delete'), [createPermissionChecker]);
  const canBulkDeleteTenants = useMemo(() => createPermissionChecker('tenants', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewAssets = useMemo(() => createPermissionChecker('assets', 'view'), [createPermissionChecker]);
  const canCreateAssets = useMemo(() => createPermissionChecker('assets', 'create'), [createPermissionChecker]);
  const canEditAssets = useMemo(() => createPermissionChecker('assets', 'edit'), [createPermissionChecker]);
  const canDeleteAssets = useMemo(() => createPermissionChecker('assets', 'delete'), [createPermissionChecker]);
  const canBulkDeleteAssets = useMemo(() => createPermissionChecker('assets', 'bulkDelete'), [createPermissionChecker]);
  
  // Asset-specific permissions
  const canViewPC = useMemo(() => createPermissionChecker('pc', 'view'), [createPermissionChecker]);
  const canCreatePC = useMemo(() => createPermissionChecker('pc', 'create'), [createPermissionChecker]);
  const canEditPC = useMemo(() => createPermissionChecker('pc', 'edit'), [createPermissionChecker]);
  const canDeletePC = useMemo(() => createPermissionChecker('pc', 'delete'), [createPermissionChecker]);
  const canBulkDeletePC = useMemo(() => createPermissionChecker('pc', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewLaptop = useMemo(() => createPermissionChecker('laptop', 'view'), [createPermissionChecker]);
  const canCreateLaptop = useMemo(() => createPermissionChecker('laptop', 'create'), [createPermissionChecker]);
  const canEditLaptop = useMemo(() => createPermissionChecker('laptop', 'edit'), [createPermissionChecker]);
  const canDeleteLaptop = useMemo(() => createPermissionChecker('laptop', 'delete'), [createPermissionChecker]);
  const canBulkDeleteLaptop = useMemo(() => createPermissionChecker('laptop', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewPrinter = useMemo(() => createPermissionChecker('printer', 'view'), [createPermissionChecker]);
  const canCreatePrinter = useMemo(() => createPermissionChecker('printer', 'create'), [createPermissionChecker]);
  const canEditPrinter = useMemo(() => createPermissionChecker('printer', 'edit'), [createPermissionChecker]);
  const canDeletePrinter = useMemo(() => createPermissionChecker('printer', 'delete'), [createPermissionChecker]);
  const canBulkDeletePrinter = useMemo(() => createPermissionChecker('printer', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewLicense = useMemo(() => createPermissionChecker('license', 'view'), [createPermissionChecker]);
  const canCreateLicense = useMemo(() => createPermissionChecker('license', 'create'), [createPermissionChecker]);
  const canEditLicense = useMemo(() => createPermissionChecker('license', 'edit'), [createPermissionChecker]);
  const canDeleteLicense = useMemo(() => createPermissionChecker('license', 'delete'), [createPermissionChecker]);
  const canBulkDeleteLicense = useMemo(() => createPermissionChecker('license', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewWarehouse = useMemo(() => createPermissionChecker('warehouse', 'view'), [createPermissionChecker]);
  const canCreateWarehouse = useMemo(() => createPermissionChecker('warehouse', 'create'), [createPermissionChecker]);
  const canEditWarehouse = useMemo(() => createPermissionChecker('warehouse', 'edit'), [createPermissionChecker]);
  const canDeleteWarehouse = useMemo(() => createPermissionChecker('warehouse', 'delete'), [createPermissionChecker]);
  const canBulkDeleteWarehouse = useMemo(() => createPermissionChecker('warehouse', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewInternet = useMemo(() => createPermissionChecker('internet', 'view'), [createPermissionChecker]);
  const canCreateInternet = useMemo(() => createPermissionChecker('internet', 'create'), [createPermissionChecker]);
  const canEditInternet = useMemo(() => createPermissionChecker('internet', 'edit'), [createPermissionChecker]);
  const canDeleteInternet = useMemo(() => createPermissionChecker('internet', 'delete'), [createPermissionChecker]);
  const canBulkDeleteInternet = useMemo(() => createPermissionChecker('internet', 'bulkDelete'), [createPermissionChecker]);
  
  const canViewSettings = useMemo(() => createPermissionChecker('settings', 'view'), [createPermissionChecker]);
  const canEditSettings = useMemo(() => createPermissionChecker('settings', 'edit'), [createPermissionChecker]);
  
  const canViewRoles = useMemo(() => createPermissionChecker('roles', 'view'), [createPermissionChecker]);
  const canCreateRoles = useMemo(() => createPermissionChecker('roles', 'create'), [createPermissionChecker]);
  const canEditRoles = useMemo(() => createPermissionChecker('roles', 'edit'), [createPermissionChecker]);
  const canDeleteRoles = useMemo(() => createPermissionChecker('roles', 'delete'), [createPermissionChecker]);
  const canBulkDeleteRoles = useMemo(() => createPermissionChecker('roles', 'bulkDelete'), [createPermissionChecker]);

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
    canBulkDeleteRoles,
  };
}