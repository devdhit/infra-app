import { useCurrentUser } from '@/hooks/useApi';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api'; // Import the API object with methods

// Global cache for permission checks shared across all instances of the hook
const globalPermissionCache = new Map<string, { value: boolean; timestamp: number }>();

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Define the permission check structure
interface PermissionCheck {
  resource: string;
  action: string;
}

// Batch permission check queue
const permissionQueue: { resource: string; action: string; resolve: (value: boolean) => void; reject: (reason: any) => void }[] = [];
let isProcessingQueue = false;

// Cleanup function to clear expired cache entries periodically
function cleanupPermissionCache() {
  const now = Date.now();
  for (const [key, cached] of globalPermissionCache.entries()) {
    if ((now - cached.timestamp) >= CACHE_TIMEOUT) {
      globalPermissionCache.delete(key);
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cleanupPermissionCache, 10 * 60 * 1000);

// Process permission queue in batches with timeout
async function processPermissionQueue() {
  if (isProcessingQueue || permissionQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  try {
    // Process queue in batches of 10 to avoid overwhelming the server
    while (permissionQueue.length > 0) {
      const batch = permissionQueue.splice(0, 10);
      
      // Create batch request
      const permissionsToCheck: PermissionCheck[] = batch.map(item => ({
        resource: item.resource,
        action: item.action
      }));

      try {
        // Add timeout to the API call
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Permission check timeout')), 10000)
        );
        
        // Make batch API call using the existing API client with proper authentication
        // Note: The API client automatically prepends /api to URLs, so we don't need to include it
        const apiCall = api.post<{ permissions: Record<string, boolean> }>('/permissions/batch', {
          permissions: permissionsToCheck
        });

        const response = await Promise.race([apiCall, timeout]) as { permissions: Record<string, boolean> };

        // Resolve each promise with the corresponding result
        // Note: api.post already unwraps the response.data, so we can access permissions directly
        for (const item of batch) {
          const key = `${item.resource}:${item.action}`;
          const hasPermission = response.permissions?.[key] ?? false;
          
          // Cache the result globally
          globalPermissionCache.set(key, {
            value: hasPermission,
            timestamp: Date.now()
          });
          
          item.resolve(hasPermission);
        }
      } catch (error: any) {
        console.error('Error checking batch permissions:', error);
        
        // Handle specific error cases
        if (error?.message?.includes('401') || error?.status === 401) {
          // For 401 errors, clear the token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/auth/login') {
              window.location.href = '/auth/login';
            }
          }
        }
        
        // Reject all promises in the batch
        for (const item of batch) {
          item.reject(error);
        }
      }

      // Add a small delay between batches to avoid overwhelming the server
      if (permissionQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

// Custom hook for checking user permissions with global caching
export function usePermissions() {
  const { data: user, isLoading } = useCurrentUser();
  const [permissionErrors, setPermissionErrors] = useState<Record<string, boolean>>({});
  
  // Helper function to check permissions via API with global caching
  const checkPermission = useCallback(async (resource: string, action: string) => {
    // For admin users, return true immediately without making API calls
    if (user?.role?.name === 'admin') {
      return true;
    }
    
    const cacheKey = `${resource}:${action}`;
    const now = Date.now();
    
    // Check if we have a cached value that's still valid
    const cached = globalPermissionCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TIMEOUT) {
      return cached.value;
    }
    
    // For non-admin users, use batch checking for better performance
    return new Promise<boolean>((resolve, reject) => {
      // Add timeout to reject the promise if it takes too long
      const timeoutId = setTimeout(() => {
        reject(new Error(`Permission check timeout for ${resource}:${action}`));
      }, 5000);
      
      // Wrap resolve and reject to clear timeout
      const wrappedResolve = (value: boolean) => {
        clearTimeout(timeoutId);
        resolve(value);
      };
      
      const wrappedReject = (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
      };
      
      // Add to queue
      permissionQueue.push({ resource, action, resolve: wrappedResolve, reject: wrappedReject });
      
      // Process queue if not already processing
      if (!isProcessingQueue) {
        setTimeout(processPermissionQueue, 10);
      }
    }).catch((error: any) => {
      console.error(`Error checking permission for ${resource}:${action}`, error);
      
      // Set error state for this permission
      setPermissionErrors(prev => ({
        ...prev,
        [cacheKey]: true
      }));
      
      // Show user-friendly error message
      if (error?.message?.includes('401')) {
        toast.error(`Authentication error. Please log in again.`);
      } else if (error?.message?.includes('timeout')) {
        // Don't show toast for timeouts to avoid spam
        console.warn(`Permission check timed out for ${resource}:${action}`);
      } else {
        toast.error(`Unable to check permissions. You may not have permission to perform this action.`);
      }
      
      // Return false on error but don't cache it
      return false;
    });
  }, [user?.role?.name]);

  // If user data is still loading, return default values
  if (isLoading || !user) {
    return {
      userRole: null,
      isLoading,
      permissionErrors: {},
      // Asset permissions
      canViewPC: () => Promise.resolve(false),
      canCreatePC: () => Promise.resolve(false),
      canEditPC: () => Promise.resolve(false),
      canDeletePC: () => Promise.resolve(false),
      canBulkDeletePC: () => Promise.resolve(false),
      canViewLaptop: () => Promise.resolve(false),
      canCreateLaptop: () => Promise.resolve(false),
      canEditLaptop: () => Promise.resolve(false),
      canDeleteLaptop: () => Promise.resolve(false),
      canBulkDeleteLaptop: () => Promise.resolve(false),
      canViewPrinter: () => Promise.resolve(false),
      canCreatePrinter: () => Promise.resolve(false),
      canEditPrinter: () => Promise.resolve(false),
      canDeletePrinter: () => Promise.resolve(false),
      canBulkDeletePrinter: () => Promise.resolve(false),
      canViewLicense: () => Promise.resolve(false),
      canCreateLicense: () => Promise.resolve(false),
      canEditLicense: () => Promise.resolve(false),
      canDeleteLicense: () => Promise.resolve(false),
      canBulkDeleteLicense: () => Promise.resolve(false),
      canViewWarehouse: () => Promise.resolve(false),
      canCreateWarehouse: () => Promise.resolve(false),
      canEditWarehouse: () => Promise.resolve(false),
      canDeleteWarehouse: () => Promise.resolve(false),
      canBulkDeleteWarehouse: () => Promise.resolve(false),
      canViewInternet: () => Promise.resolve(false),
      canCreateInternet: () => Promise.resolve(false),
      canEditInternet: () => Promise.resolve(false),
      canDeleteInternet: () => Promise.resolve(false),
      canBulkDeleteInternet: () => Promise.resolve(false),
      // Settings permissions
      canViewSettings: () => Promise.resolve(false),
      canEditSettings: () => Promise.resolve(false),
      canViewAuditLogs: () => Promise.resolve(false),
      // Asset management permissions (generic)
      canViewAssets: () => Promise.resolve(false),
      // User management permissions
      canViewUsers: () => Promise.resolve(false),
      canCreateUsers: () => Promise.resolve(false),
      canEditUsers: () => Promise.resolve(false),
      canDeleteUsers: () => Promise.resolve(false),
      canBulkDeleteUsers: () => Promise.resolve(false),
      canViewTenants: () => Promise.resolve(false),
      canCreateTenants: () => Promise.resolve(false),
      canEditTenants: () => Promise.resolve(false),
      canDeleteTenants: () => Promise.resolve(false),
      canBulkDeleteTenants: () => Promise.resolve(false),
      canViewRoles: () => Promise.resolve(false),
      canCreateRoles: () => Promise.resolve(false),
      canEditRoles: () => Promise.resolve(false),
      canDeleteRoles: () => Promise.resolve(false),
      canBulkDeleteRoles: () => Promise.resolve(false)
    };
  }

  // For admin users, all permissions are true
  if (user.role?.name === 'admin') {
    return {
      userRole: user.role?.name || null,
      isLoading,
      permissionErrors: {},
      // Asset permissions
      canViewPC: () => Promise.resolve(true),
      canCreatePC: () => Promise.resolve(true),
      canEditPC: () => Promise.resolve(true),
      canDeletePC: () => Promise.resolve(true),
      canBulkDeletePC: () => Promise.resolve(true),
      canViewLaptop: () => Promise.resolve(true),
      canCreateLaptop: () => Promise.resolve(true),
      canEditLaptop: () => Promise.resolve(true),
      canDeleteLaptop: () => Promise.resolve(true),
      canBulkDeleteLaptop: () => Promise.resolve(true),
      canViewPrinter: () => Promise.resolve(true),
      canCreatePrinter: () => Promise.resolve(true),
      canEditPrinter: () => Promise.resolve(true),
      canDeletePrinter: () => Promise.resolve(true),
      canBulkDeletePrinter: () => Promise.resolve(true),
      canViewLicense: () => Promise.resolve(true),
      canCreateLicense: () => Promise.resolve(true),
      canEditLicense: () => Promise.resolve(true),
      canDeleteLicense: () => Promise.resolve(true),
      canBulkDeleteLicense: () => Promise.resolve(true),
      canViewWarehouse: () => Promise.resolve(true),
      canCreateWarehouse: () => Promise.resolve(true),
      canEditWarehouse: () => Promise.resolve(true),
      canDeleteWarehouse: () => Promise.resolve(true),
      canBulkDeleteWarehouse: () => Promise.resolve(true),
      canViewInternet: () => Promise.resolve(true),
      canCreateInternet: () => Promise.resolve(true),
      canEditInternet: () => Promise.resolve(true),
      canDeleteInternet: () => Promise.resolve(true),
      canBulkDeleteInternet: () => Promise.resolve(true),
      // Settings permissions
      canViewSettings: () => Promise.resolve(true),
      canEditSettings: () => Promise.resolve(true),
      canViewAuditLogs: () => Promise.resolve(true),
      // Asset management permissions (generic)
      canViewAssets: () => Promise.resolve(true),
      // User management permissions
      canViewUsers: () => Promise.resolve(true),
      canCreateUsers: () => Promise.resolve(true),
      canEditUsers: () => Promise.resolve(true),
      canDeleteUsers: () => Promise.resolve(true),
      canBulkDeleteUsers: () => Promise.resolve(true),
      canViewTenants: () => Promise.resolve(true),
      canCreateTenants: () => Promise.resolve(true),
      canEditTenants: () => Promise.resolve(true),
      canDeleteTenants: () => Promise.resolve(true),
      canBulkDeleteTenants: () => Promise.resolve(true),
      canViewRoles: () => Promise.resolve(true),
      canCreateRoles: () => Promise.resolve(true),
      canEditRoles: () => Promise.resolve(true),
      canDeleteRoles: () => Promise.resolve(true),
      canBulkDeleteRoles: () => Promise.resolve(true)
    };
  }

  // Asset permissions
  const canViewPC = () => checkPermission('pc', 'view');
  const canCreatePC = () => checkPermission('pc', 'create');
  const canEditPC = () => checkPermission('pc', 'edit');
  const canDeletePC = () => checkPermission('pc', 'delete');
  const canBulkDeletePC = () => checkPermission('pc', 'bulkDelete');

  const canViewLaptop = () => checkPermission('laptop', 'view');
  const canCreateLaptop = () => checkPermission('laptop', 'create');
  const canEditLaptop = () => checkPermission('laptop', 'edit');
  const canDeleteLaptop = () => checkPermission('laptop', 'delete');
  const canBulkDeleteLaptop = () => checkPermission('laptop', 'bulkDelete');

  const canViewPrinter = () => checkPermission('printer', 'view');
  const canCreatePrinter = () => checkPermission('printer', 'create');
  const canEditPrinter = () => checkPermission('printer', 'edit');
  const canDeletePrinter = () => checkPermission('printer', 'delete');
  const canBulkDeletePrinter = () => checkPermission('printer', 'bulkDelete');

  const canViewLicense = () => checkPermission('license', 'view');
  const canCreateLicense = () => checkPermission('license', 'create');
  const canEditLicense = () => checkPermission('license', 'edit');
  const canDeleteLicense = () => checkPermission('license', 'delete');
  const canBulkDeleteLicense = () => checkPermission('license', 'bulkDelete');

  const canViewWarehouse = () => checkPermission('warehouse', 'view');
  const canCreateWarehouse = () => checkPermission('warehouse', 'create');
  const canEditWarehouse = () => checkPermission('warehouse', 'edit');
  const canDeleteWarehouse = () => checkPermission('warehouse', 'delete');
  const canBulkDeleteWarehouse = () => checkPermission('warehouse', 'bulkDelete');

  const canViewInternet = () => checkPermission('internet', 'view');
  const canCreateInternet = () => checkPermission('internet', 'create');
  const canEditInternet = () => checkPermission('internet', 'edit');
  const canDeleteInternet = () => checkPermission('internet', 'delete');
  const canBulkDeleteInternet = () => checkPermission('internet', 'bulkDelete');

  // Settings permissions
  const canViewSettings = () => checkPermission('settings', 'view');
  const canEditSettings = () => checkPermission('settings', 'edit');
  const canViewAuditLogs = () => checkPermission('auditLogs', 'view');
      
  // Asset management permissions (generic)
  const canViewAssets = () => Promise.all([
    checkPermission('pc', 'view'),
    checkPermission('laptop', 'view'),
    checkPermission('printer', 'view'),
    checkPermission('license', 'view'),
    checkPermission('warehouse', 'view'),
    checkPermission('internet', 'view')
  ]).then(results => results.some(result => result));

  // User management permissions
  const canViewUsers = () => checkPermission('users', 'view');
  const canCreateUsers = () => checkPermission('users', 'create');
  const canEditUsers = () => checkPermission('users', 'edit');
  const canDeleteUsers = () => checkPermission('users', 'delete');
  const canBulkDeleteUsers = () => checkPermission('users', 'bulkDelete');

  const canViewTenants = () => checkPermission('tenants', 'view');
  const canCreateTenants = () => checkPermission('tenants', 'create');
  const canEditTenants = () => checkPermission('tenants', 'edit');
  const canDeleteTenants = () => checkPermission('tenants', 'delete');
  const canBulkDeleteTenants = () => checkPermission('tenants', 'bulkDelete');

  const canViewRoles = () => checkPermission('roles', 'view');
  const canCreateRoles = () => checkPermission('roles', 'create');
  const canEditRoles = () => checkPermission('roles', 'edit');
  const canDeleteRoles = () => checkPermission('roles', 'delete');
  const canBulkDeleteRoles = () => checkPermission('roles', 'bulkDelete');

  return {
    userRole: user.role?.name || null,
    isLoading,
    permissionErrors,
    // Asset permissions
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
    // Settings permissions
    canViewSettings,
    canEditSettings,
    canViewAuditLogs,
    // Asset management permissions (generic)
    canViewAssets,
    // User management permissions
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
    canViewRoles,
    canCreateRoles,
    canEditRoles,
    canDeleteRoles,
    canBulkDeleteRoles
  };
}