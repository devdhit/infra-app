// Remove React Query imports and replace with direct API calls
import { api, ApiError, ValidationError } from '@/lib/api'
import { toast } from 'sonner'
import { getModelType } from '@/lib/custom-fields'
import { User, UserCreateUpdate } from '@/types/users'
import { useState, useEffect, useCallback } from 'react'
import logger from '@/lib/logger'

// Generic API hook with direct API calls instead of React Query
export function useApiCall<T>(url: string, options: { enabled?: boolean } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const fetchData = useCallback(async () => {
    if (options.enabled === false) return Promise.resolve();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use less aggressive cache-busting for auth endpoints
      let urlWithCacheBuster = url;
      if (url.includes('/auth/me')) {
        // For auth endpoints, use simpler cache-busting to allow some caching
        const cacheBuster = `_t=${Math.floor(Date.now() / 60000)}`; // Cache for 1 minute
        const separator = url.includes('?') ? '&' : '?';
        urlWithCacheBuster = `${url}${separator}${cacheBuster}`;
      } else {
        // For other endpoints, add cache-busting timestamp to prevent browser caching
        const cacheBuster = `_t=${Date.now()}`;
        const separator = url.includes('?') ? '&' : '?';
        urlWithCacheBuster = `${url}${separator}${cacheBuster}`;
      }
      
      const response = await api.get<T>(urlWithCacheBuster);
      setData(response);
      return response;
    } catch (err) {
      setError(err as ApiError);
      logger.error('API Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url, options.enabled]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, isLoading, error, refetch: fetchData };
}

// Centralized error handling for mutations
const handleMutationError = (err: unknown, defaultMessage: string): string => {
  let message = defaultMessage;
  
  if (err instanceof ValidationError) {
    message = 'Validation failed. Please check the form for errors.';
  } else if ((err as ApiError).status === 409) {
    message = 'Conflict. The resource may already exist.';
  } else if ((err as ApiError).status === 403) {
    message = 'Access denied. You do not have permission to perform this action.';
  } else if ((err as ApiError).status === 400) {
    message = 'Bad request. Please check the form data.';
  } else if ((err as ApiError).status === 404) {
    message = 'Resource not found. It may have been deleted.';
  } else if ((err as ApiError).status === 500) {
    message = 'Server error. Please try again later.';
  } else if ((err as ApiError).message) {
    message = (err as ApiError).message;
  }
  
  return message;
};

// Generic mutation hook for POST requests
export function useApiMutation<T, V>(url: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const mutate = async (data: V) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post<T, V>(url, data);
      return response;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { mutate, isLoading, error };
}

// Generic mutation hook for PUT requests
export function useApiUpdate<T, V>(url: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const mutate = async (data: V) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put<T, V>(url, data);
      return response;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { mutate, isLoading, error };
}

// Generic mutation hook for DELETE requests
export function useApiDelete<T>(url: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const mutate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.delete<T>(url);
      return response;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { mutate, isLoading, error };
}

// Generic mutation hook for DELETE requests with ID parameter
export function useApiDeleteWithId<T>(url: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const mutate = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure the URL is properly constructed
      // Remove leading slash if present to avoid double slashes
      const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
      const fullUrl = `${cleanUrl}/${id}`;
      const response = await api.delete<T>(fullUrl);
      return response;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { mutate, isLoading, error };
}

export function useCreateAsset<T, V>(assetType: string) {
  const { mutate, isLoading, error } = useApiMutation<T, V>(`/assets/${assetType}`);
  
  const createAsset = async (data: V) => {
    try {
      const response = await mutate(data);
      toast.success(`${assetType} created successfully`);
      return response;
    } catch (err) {
      const message = handleMutationError(err, `Failed to create ${assetType}`);
      toast.error(message);
      throw err;
    }
  };
  
  return { createAsset, isLoading, error };
}

export function useUpdateAsset<T, V>(assetType: string, id: string) {
  const { mutate, isLoading, error } = useApiUpdate<T, V>(`/assets/${assetType}/${id}`);
  
  const updateAsset = async (data: V) => {
    try {
      const response = await mutate(data);
      toast.success(`${assetType} updated successfully`);
      return response;
    } catch (err) {
      const message = handleMutationError(err, `Failed to update ${assetType}`);
      toast.error(message);
      throw err;
    }
  };
  
  return { updateAsset, isLoading, error };
}

export function useDeleteAsset<T>(assetType: string) {
  const { mutate, isLoading, error } = useApiDeleteWithId<T>(`/assets/${assetType}`);
  
  const deleteAsset = async (id: string) => {
    try {
      const response = await mutate(id);
      // Don't show toast here - let the caller handle it for optimistic updates
      return response;
    } catch (err) {
      // Don't show toast here - let the caller handle it
      throw err;
    }
  };
  
  return { deleteAsset, isLoading, error };
}

// Bulk delete assets hook
export function useBulkDeleteAssets<T>(assetType: string) {
  const { mutate, isLoading, error } = useApiMutation<T, { ids: string[] }>(`/assets/${assetType}/bulk-delete`);
  
  const bulkDeleteAssets = async (ids: string[]) => {
    try {
      const response = await mutate({ ids });
      // Don't show toast here - let the caller handle it for optimistic updates
      return response;
    } catch (err) {
      // Don't show toast here - let the caller handle it
      throw err;
    }
  };
  
  return { bulkDeleteAssets, isLoading, error };
}

// Auth hooks
export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
    tenantId: string
  }
}

export function useLogin() {
  const { mutate, isLoading, error } = useApiMutation<LoginResponse, LoginData>('/auth/login')
  
  const login = async (data: LoginData) => {
    try {
      const response = await mutate(data)
      // Set the token in the API client
      if (response.token) {
        api.setToken(response.token)
        // Also save to localStorage for persistence
        localStorage.setItem('auth-token', response.token)
      }
      toast.success('Login successful')
      return response
    } catch (err) {
      // Login error
      let message = 'Login failed'
      
      if ((err as ApiError).status === 401) {
        message = 'Invalid email or password'
      } else if ((err as ApiError).status === 429) {
        message = 'Too many login attempts. Please try again later.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).status === 503) {
        message = 'Service unavailable. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { login, isLoading, error }
}

export function useLogout() {
  const { mutate, isLoading, error } = useApiMutation<void, void>('/auth/logout')
  
  const logout = async () => {
    try {
      await mutate()
      // Clear the token
      api.setToken(null)
      toast.success('Logout successful')
      // Redirect to login (this should be handled in the component)
      return
    } catch (err) {
      // Logout error
      let message = 'Logout failed'
      
      if ((err as ApiError).status === 500) {
        message = 'Server error during logout. Please try again.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { logout, isLoading, error }
}

// User hooks
export type { User, UserCreateUpdate } from '@/types/users'

export function useUsers() {
  return useApiCall<User[]>('/users')
}

export function useUser(id: string) {
  return useApiCall<User>(`/users/${id}`)
}

export function useCreateUser() {
  const { mutate, isLoading, error } = useApiMutation<User, Partial<UserCreateUpdate>>('/users')
  
  const createUser = async (data: Partial<UserCreateUpdate>) => {
    try {
      const response = await mutate(data)
      toast.success('User created successfully')
      return response
    } catch (err) {
      // Error creating user
      let message = 'Failed to create user'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 409) {
        message = 'A user with this email already exists.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to create users.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { createUser, isLoading, error }
}

export function useUpdateUser(id: string) {
  const { mutate, isLoading, error } = useApiUpdate<User, Partial<UserCreateUpdate>>(`/users/${id}`)
  
  const updateUser = async (data: Partial<UserCreateUpdate>) => {
    try {
      const response = await mutate(data)
      toast.success('User updated successfully')
      return response
    } catch (err) {
      // Error updating user
      let message = 'Failed to update user'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 409) {
        message = 'A user with this email already exists.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update this user.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 404) {
        message = 'User not found. They may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateUser, isLoading, error }
}

export function useDeleteUser(id: string) {
  const { mutate, isLoading, error } = useApiDeleteWithId<void>('/users')
  
  const deleteUser = async () => {
    try {
      const response = await mutate(id)
      toast.success('User deleted successfully')
      return response
    } catch (err) {
      // Error deleting user
      let message = 'Failed to delete user'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete this user.'
      } else if ((err as ApiError).status === 404) {
        message = 'User not found. They may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { deleteUser, isLoading, error }
}

// Bulk delete users hook
export function useBulkDeleteUsers() {
  const { mutate, isLoading, error } = useApiMutation<void, { ids: string[] }>('/users/bulk-delete')
  
  const bulkDeleteUsers = async (ids: string[]) => {
    try {
      const response = await mutate({ ids })
      toast.success('Users deleted successfully')
      return response
    } catch (err) {
      // Error bulk deleting users
      let message = 'Failed to delete users'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete these users.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. No users selected for deletion.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { bulkDeleteUsers, isLoading, error }
}

// Tenant hooks
export interface Tenant {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
    pcs: number
    laptops: number
    printers: number
    licenses: number
    warehouseITs: number
    internets: number
  }
}

export function useTenants() {
  return useApiCall<Tenant[]>('/tenants')
}

export function useTenant(id: string) {
  return useApiCall<Tenant>(`/tenants/${id}`)
}

export function useCreateTenant() {
  const { mutate, isLoading, error } = useApiMutation<Tenant, Partial<Tenant>>('/tenants')
  
  const createTenant = async (data: Partial<Tenant>) => {
    try {
      const response = await mutate(data)
      // Refetch tenants after successful creation
      window.dispatchEvent(new Event('tenants-updated'))
      toast.success('Tenant created successfully')
      return response
    } catch (err) {
      // Error creating tenant
      let message = 'Failed to create tenant'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 409) {
        message = 'A tenant with this name already exists.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to create tenants.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { createTenant, isLoading, error }
}

export function useUpdateTenant(id: string) {
  const { mutate, isLoading, error } = useApiUpdate<Tenant, Partial<Tenant>>(`/tenants/${id}`)
  
  const updateTenant = async (data: Partial<Tenant>) => {
    try {
      const response = await mutate(data)
      // Refetch tenants after successful update
      window.dispatchEvent(new Event('tenants-updated'))
      toast.success('Tenant updated successfully')
      return response
    } catch (err) {
      // Error updating tenant
      let message = 'Failed to update tenant'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 409) {
        message = 'A tenant with this name already exists.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update this tenant.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 404) {
        message = 'Tenant not found. It may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateTenant, isLoading, error }
}

export function useDeleteTenant(id: string) {
  const { mutate, isLoading, error } = useApiDeleteWithId<void>('/tenants')
  
  const deleteTenant = async () => {
    try {
      const response = await mutate(id)
      // Refetch tenants after successful deletion
      window.dispatchEvent(new Event('tenants-updated'))
      toast.success('Tenant deleted successfully')
      return response
    } catch (err) {
      // Error deleting tenant
      let message = 'Failed to delete tenant'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete this tenant.'
      } else if ((err as ApiError).status === 404) {
        message = 'Tenant not found. It may have been deleted.'
      } else if ((err as ApiError).status === 400) {
        message = (err as ApiError).message || 'Cannot delete tenant with associated data. Please delete all associated users and assets first.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { deleteTenant, isLoading, error }
}

// Bulk delete tenants hook
export function useBulkDeleteTenants() {
  const { mutate, isLoading, error } = useApiMutation<void, { ids: string[] }>('/tenants/bulk-delete')
  
  const bulkDeleteTenants = async (ids: string[]) => {
    try {
      const response = await mutate({ ids })
      // Refetch tenants after successful bulk deletion
      window.dispatchEvent(new Event('tenants-updated'))
      toast.success('Tenants deleted successfully')
      return response
    } catch (err) {
      // Error bulk deleting tenants
      let message = 'Failed to delete tenants'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete these tenants.'
      } else if ((err as ApiError).status === 404) {
        message = 'One or more tenants not found. They may have been deleted.'
      } else if ((err as ApiError).status === 400) {
        message = (err as ApiError).message || 'Cannot delete tenants with associated data. Please delete all associated users and assets first.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { bulkDeleteTenants, isLoading, error }
}

// Dashboard hook
export interface DashboardData {
  assets: {
    total: number
    pc: number
    laptop: number
    printer: number
    license: number
    warehouse: number
  }
  statusBreakdown: {
    pc: Array<{ status: string; _count: number }>
    laptop: Array<{ status: string; _count: number }>
  }
  recentActivities: Array<{
    id: string
    action: string
    modelType: string
    createdAt: string
    user?: {
      name: string
    }
  }>
}

export function useDashboard<T = DashboardData>() {
  return useApiCall<T>('/dashboard')
}

export interface DashboardSummaryData {
  pc: Array<{
    cpuBarcode: string | null;
    cpuSapBarcode: string | null;
    monitorBarcode: string | null;
    monitorSapBarcode: string | null;
    upsBarcode: string | null;
    upsSapBarcode: string | null;
    _count: number;
  }>;
  laptop: Array<{
    status: string | null;
    model: string | null;
    _count: number;
  }>;
  printer: Array<{
    color: string | null;
    model: string | null;
    location: string | null;
    _count: number;
  }>;
  license: Array<{
    softwareName: string | null;
    productType: string | null;
    licenseKey: string | null;
    _count: number;
  }>;
  warehouseIT: Array<{
    cpuBarcode: string | null;
    cpuSapBarcode: string | null;
    monitorBarcode: string | null;
    monitorSapBarcode: string | null;
    upsBarcode: string | null;
    upsSapBarcode: string | null;
    status: string | null;
    model: string | null;
    ram: string | null;
    cpu: string | null;
    type: string | null;
    _count: number;
  }>;
  customFields: any[];
}

export function useDashboardSummary<T = DashboardSummaryData>() {
  return useApiCall<T>('/dashboard/summary')
}

// Current user hook
export function useCurrentUser() {
  // Only make the API call if there's a token in localStorage or API client
  const hasToken = typeof window !== 'undefined' && 
    (localStorage.getItem('auth-token') || api.getToken());
  
  // Ensure we only enable the query if we have a token
  return useApiCall<User>('/auth/me', { enabled: !!hasToken && hasToken.length > 0 });
}

// Asset-specific hooks
export function useAssets<T>(assetType: string, params: Record<string, any> = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `/assets/${assetType}${queryString ? `?${queryString}` : ''}`;
  return useApiCall<T>(url);
}

export function useAsset<T>(assetType: string, id: string) {
  return useApiCall<T>(`/assets/${assetType}/${id}`);
}

// Custom Fields hooks
export interface CustomField {
  id: string
  name: string
  type: string
  modelType: string
  required: boolean
  createdAt: string
  updatedAt: string
  description?: string
}

export interface CustomFieldFormData {
  name: string
  type: string
  modelType: string
  required: boolean
  description?: string
}

export function useCustomFields(modelType?: string) {
  // Use the utility function to ensure consistent model type mapping
  const mappedModelType = modelType ? getModelType(modelType) : undefined;
  const queryString = mappedModelType ? `?modelType=${mappedModelType}` : ''
  return useApiCall<CustomField[]>(`/custom-fields${queryString}`)
}

export function useCreateCustomField() {
  const { mutate, isLoading, error } = useApiMutation<CustomField, CustomFieldFormData>('/custom-fields')
  
  const createCustomField = async (data: CustomFieldFormData) => {
    try {
      const response = await mutate(data)
      toast.success('Custom field created successfully')
      return response
    } catch (err) {
      // Error creating custom field
      let message = 'Failed to create custom field'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to create custom fields.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { createCustomField, isLoading, error }
}

export function useUpdateCustomField(id: string) {
  const { mutate, isLoading, error } = useApiUpdate<CustomField, CustomFieldFormData>(`/custom-fields/${id}`)
  
  const updateCustomField = async (data: CustomFieldFormData) => {
    try {
      const response = await mutate(data)
      toast.success('Custom field updated successfully')
      return response
    } catch (err) {
      // Error updating custom field
      let message = 'Failed to update custom field'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update this custom field.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 404) {
        message = 'Custom field not found. It may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateCustomField, isLoading, error }
}

export function useDeleteCustomField(id: string) {
  const { mutate, isLoading, error } = useApiDelete<void>(`/custom-fields/${id}`)
  
  const deleteCustomField = async () => {
    try {
      const response = await mutate()
      toast.success('Custom field deleted successfully')
      return response
    } catch (err) {
      // Error deleting custom field
      let message = 'Failed to delete custom field'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete this custom field.'
      } else if ((err as ApiError).status === 404) {
        message = 'Custom field not found. It may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { deleteCustomField, isLoading, error }
}

// Asset Custom Fields hooks
export function useAssetCustomFields(assetType: string, id: string) {
  return useApiCall<any>(`/assets/custom-fields/${id}?assetType=${assetType}`)
}

// Hook for updating asset custom fields
export function useUpdateAssetCustomFields(modelType: string, id: string) {
  const { mutate, isLoading, error } = useApiUpdate<any, any>(`/assets/custom-fields/${id}?assetType=${modelType}`)
  
  const updateAssetCustomFields = async (data: any) => {
    try {
      const response = await mutate(data)
      toast.success('Asset custom fields updated successfully')
      return response
    } catch (err) {
      // Error updating asset custom fields
      let message = 'Failed to update asset custom fields'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update these custom fields.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 404) {
        message = 'Asset not found. It may have been deleted.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateAssetCustomFields, isLoading, error }
}

// Audit Logs Settings hooks
export interface AuditLogsSettings {
  id?: string
  enabled: boolean
  retentionPeriod: number
  logAssetCreation: boolean
  logAssetUpdates: boolean
  logAssetDeletion: boolean
  logUserLogin: boolean
  logUserLogout: boolean
  logPermissionChanges: boolean
  notifyOnCriticalEvents: boolean
  emailNotifications: boolean
  slackNotifications: boolean
  notificationEmail: string
  createdAt?: string
  updatedAt?: string
}

export function useAuditLogsSettings() {
  return useApiCall<AuditLogsSettings>('/audit-logs/settings')
}

export function useUpdateAuditLogsSettings() {
  const { mutate, isLoading, error } = useApiUpdate<AuditLogsSettings, Partial<AuditLogsSettings>>('/audit-logs/settings')
  
  const updateAuditLogsSettings = async (data: Partial<AuditLogsSettings>) => {
    try {
      const response = await mutate(data)
      toast.success('Audit logs settings updated successfully')
      return response
    } catch (err) {
      // Error updating audit logs settings
      let message = 'Failed to update audit logs settings'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update audit logs settings.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateAuditLogsSettings, isLoading, error }
}

// Performance monitoring hooks
export interface PerformanceMetrics {
  id: string
  metricType: string
  value: number
  unit: string
  recordedAt: string
  tenantId: string
}

export function usePerformanceMetrics() {
  return useApiCall<PerformanceMetrics[]>('/performance/metrics')
}

export function useCreatePerformanceMetric() {
  const { mutate, isLoading, error } = useApiMutation<PerformanceMetrics, Omit<PerformanceMetrics, 'id' | 'recordedAt'>>('/performance/metrics')
  
  const createPerformanceMetric = async (data: Omit<PerformanceMetrics, 'id' | 'recordedAt'>) => {
    try {
      const response = await mutate(data)
      return response
    } catch (err) {
      // Error creating performance metric
      let message = 'Failed to create performance metric'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to create performance metrics.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { createPerformanceMetric, isLoading, error }
}

// Roles hooks
export interface Role {
  id: string
  name: string
  description?: string
  permissions: any[]
  createdAt: string
  updatedAt: string
}

export function useRoles() {
  return useApiCall<Role[]>('/roles')
}

export function useRole(id: string) {
  return useApiCall<Role>(`/roles/${id}`)
}

export function useCreateRole() {
  const { mutate, isLoading, error } = useApiMutation<Role, Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>('/roles')
  
  const createRole = async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await mutate(data)
      toast.success('Role created successfully')
      return response
    } catch (err) {
      // Error creating role
      let message = 'Failed to create role'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to create roles.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 409) {
        message = 'A role with this name already exists.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { createRole, isLoading, error }
}

export function useUpdateRole(id: string) {
  const { mutate, isLoading, error } = useApiUpdate<Role, Partial<Role>>(`/roles/${id}`)
  
  const updateRole = async (data: Partial<Role>) => {
    try {
      const response = await mutate(data)
      toast.success('Role updated successfully')
      return response
    } catch (err) {
      // Error updating role
      let message = 'Failed to update role'
      
      if (err instanceof ValidationError) {
        message = 'Validation failed. Please check the form for errors.'
      } else if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to update this role.'
      } else if ((err as ApiError).status === 400) {
        message = 'Bad request. Please check the form data.'
      } else if ((err as ApiError).status === 404) {
        message = 'Role not found. It may have been deleted.'
      } else if ((err as ApiError).status === 409) {
        message = 'A role with this name already exists.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { updateRole, isLoading, error }
}

export function useDeleteRole(id: string) {
  const { mutate, isLoading, error } = useApiDeleteWithId<void>('/roles')
  
  const deleteRole = async () => {
    try {
      const response = await mutate(id)
      toast.success('Role deleted successfully')
      return response
    } catch (err) {
      // Error deleting role
      let message = 'Failed to delete role'
      
      if ((err as ApiError).status === 403) {
        message = 'Access denied. You do not have permission to delete this role.'
      } else if ((err as ApiError).status === 404) {
        message = 'Role not found. It may have been deleted.'
      } else if ((err as ApiError).status === 400) {
        message = 'Cannot delete role that is assigned to users.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { deleteRole, isLoading, error }
}

// Permissions hooks
export interface PermissionCheckRequest {
  resource: string
  action: string
  resourceId?: string
}

export interface PermissionCheckResponse {
  allowed: boolean
  reason?: string
}

export function useCheckPermission() {
  const { mutate, isLoading, error } = useApiMutation<PermissionCheckResponse, PermissionCheckRequest>('/permissions/check')
  
  const checkPermission = async (data: PermissionCheckRequest) => {
    try {
      const response = await mutate(data)
      return response
    } catch (err) {
      // Error checking permission
      let message = 'Failed to check permissions'
      
      if ((err as ApiError).status === 400) {
        message = 'Invalid permission check request.'
      } else if ((err as ApiError).status === 500) {
        message = 'Server error. Please try again later.'
      } else if ((err as ApiError).message) {
        message = (err as ApiError).message
      }
      
      toast.error(message)
      throw err
    }
  }
  
  return { checkPermission, isLoading, error }
}