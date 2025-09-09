import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { api, ApiError, ValidationError } from '@/lib/api'
import { toast } from 'sonner'
import { getModelType } from '@/lib/custom-fields'
import { User, UserCreateUpdate } from '@/types/users'

// Define more specific types for useApiQuery
type ApiQueryOptions<T> = Omit<UseQueryOptions<T, ApiError, T, string[]>, 'queryKey' | 'queryFn'>

// Generic API hook with better typing and caching
export function useApiQuery<T>(key: string[], url: string, options: ApiQueryOptions<T> = {}) {
  return useQuery<T, ApiError, T, string[]>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<T>(url)
      return response
    },
    // Implement optimized caching strategy
    staleTime: 10 * 60 * 1000, // 10 minutes by default
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnReconnect: false, // Reduce unnecessary refetches
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    ...options
  })
}

// Better types for mutation hooks
type ApiMutationOptions<T, V> = Omit<UseMutationOptions<T, ApiError, V, unknown>, 'mutationFn'>

// Generic mutation hook for POST requests
export function useApiMutation<T, V>(url: string, options: ApiMutationOptions<T, V> = {}) {
  
  return useMutation<T, ApiError, V>({
    mutationFn: async (data: V) => {
      const response = await api.post<T, V>(url, data)
      return response
    },
    ...options
  })
}

// Generic mutation hook for PUT requests
export function useApiUpdate<T, V>(url: string, options = {}) {
  
  return useMutation<T, ApiError, V>({
    mutationFn: async (data: V) => {
      const response = await api.put<T, V>(url, data)
      return response
    },
    ...options
  })
}

// Generic mutation hook for DELETE requests
export function useApiDelete<T>(url: string, options = {}) {
  
  return useMutation<T, ApiError, void>({
    mutationFn: async () => {
      const response = await api.delete<T>(url)
      return response
    },
    ...options
  })
}

// Generic mutation hook for DELETE requests with ID parameter
export function useApiDeleteWithId<T>(url: string, options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation<T, ApiError, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete<T>(`${url}/${id}`)
      return response
    },
    onSuccess: (...args) => {
      // Invalidate all queries related to assets when a deletion occurs
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      // Call any additional onSuccess handlers
      if (options && typeof options === 'object' && 'onSuccess' in options) {
        const onSuccess = (options as any).onSuccess
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(...args)
        }
      }
    },
    ...options
  })
}

// Asset-specific hooks
export function useAssets<T>(assetType: string, params: Record<string, any> = {}, options: ApiQueryOptions<T> = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `/assets/${assetType}${queryString ? `?${queryString}` : ''}`
  
  // Convert params object to a string for the query key to ensure it's serializable
  const paramsKey = JSON.stringify(params)
  
  return useApiQuery<T>(['assets', assetType, paramsKey], url, {
    // Asset data can be cached longer since it doesn't change frequently
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes garbage collection time
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    ...options
  })
}

export function useAsset<T>(assetType: string, id: string) {
  return useApiQuery<T>(['assets', assetType, id], `/assets/${assetType}/${id}`, {
    // Individual asset data can be cached for a moderate time
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useCreateAsset<T, V>(assetType: string) {
  const queryClient = useQueryClient()
  
  return useApiMutation<T, V>(
    `/assets/${assetType}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
      },
      onError: (error: ApiError) => {
        // Error creating asset
        let message = `Failed to create ${assetType}`
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'An asset with this identifier already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to create this asset.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useUpdateAsset<T, V>(assetType: string, id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<T, V>(
    `/assets/${assetType}/${id}`,
    {
      onSuccess: () => {
        // Get current pagination parameters from cache
        const queryKeys = queryClient.getQueryCache().getAll().map(query => query.queryKey);
        
        // Refresh the main list view
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        
        // Refresh any cached pagination versions
        queryKeys.forEach(key => {
          // Check if this is a paginated assets query for this asset type
          if (Array.isArray(key) && 
              key.length > 2 && 
              key[0] === 'assets' && 
              key[1] === assetType && 
              typeof key[2] === 'string') {
            // Forcefully invalidate this specific query
            queryClient.invalidateQueries({ queryKey: key, exact: true });
            // Force a refetch of this specific query
            queryClient.refetchQueries({ queryKey: key, exact: true });
          }
        });
        
        // Invalidate the specific asset query to ensure view/edit dialogs refresh
        queryClient.invalidateQueries({ queryKey: ['assets', assetType, id] });
        
        // Force a refetch of all invalidated queries to ensure data is up-to-date
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['assets', assetType] });
        }, 100);
      },
      onError: (error: ApiError) => {
        // Error updating asset
        let message = `Failed to update ${assetType}`
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'An asset with this identifier already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to update this asset.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 404) {
          message = 'Asset not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteAsset<T>(assetType: string) {
  const queryClient = useQueryClient()
  
  return useApiDeleteWithId<T>(
    `/assets/${assetType}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
      },
      onError: (error: ApiError) => {
        // Error deleting asset
        let message = `Failed to delete ${assetType}`
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete this asset.'
        } else if (error.status === 404) {
          message = 'Asset not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

// Bulk delete assets hook
export function useBulkDeleteAssets<T>(assetType: string) {
  const queryClient = useQueryClient()
  
  return useApiMutation<T, { ids: string[] }>(
    `/assets/${assetType}/bulk-delete`,
    {
      onSuccess: async () => {
        // First invalidate all asset queries for this asset type
        await queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        // Refetch to ensure UI updates
        await queryClient.refetchQueries({ queryKey: ['assets', assetType] });
      },
      onError: (error: ApiError) => {
        // Error bulk deleting assets
        let message = `Failed to delete ${assetType} assets`
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete these assets.'
        } else if (error.status === 400) {
          message = 'Bad request. No assets selected for deletion.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
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
  const queryClient = useQueryClient()
  
  return useApiMutation<LoginResponse, LoginData>('/auth/login', {
    onSuccess: (data: LoginResponse) => {
      // Set the token in the API client
      if (data.token) {
        api.setToken(data.token)
        // Also save to localStorage for persistence
        localStorage.setItem('auth-token', data.token)
      }
      // Invalidate all queries to refresh the app state
      queryClient.invalidateQueries()
    },
    onError: (error: ApiError) => {
      // Login error
      let message = 'Login failed'
      
      if (error.status === 401) {
        message = 'Invalid email or password'
      } else if (error.status === 429) {
        message = 'Too many login attempts. Please try again later.'
      } else if (error.status === 500) {
        message = 'Server error. Please try again later.'
      } else if (error.status === 503) {
        message = 'Service unavailable. Please try again later.'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  
  return useApiMutation<void, void>('/auth/logout', {
    onSuccess: () => {
      // Clear the token
      api.setToken(null)
      // Invalidate all queries to clear cached data
      queryClient.clear()
      // Redirect to login (this should be handled in the component)
    },
    onError: (error: ApiError) => {
      // Logout error
      let message = 'Logout failed'
      
      if (error.status === 500) {
        message = 'Server error during logout. Please try again.'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  })
}

// User hooks
export type { User, UserCreateUpdate } from '@/types/users'

export function useUsers() {
  return useApiQuery<User[]>(['users'], '/users', {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useUser(id: string) {
  return useApiQuery<User>(['users', id], `/users/${id}`, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useApiMutation<User, Partial<UserCreateUpdate>>(
    '/users',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: ApiError) => {
        // Error creating user
        let message = 'Failed to create user'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A user with this email already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to create users.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<User, Partial<UserCreateUpdate>>(
    `/users/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['users', id] })
      },
      onError: (error: ApiError) => {
        // Error updating user
        let message = 'Failed to update user'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A user with this email already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to update this user.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 404) {
          message = 'User not found. They may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteUser(_id: string) {
  const queryClient = useQueryClient()
  
  return useApiDeleteWithId<void>(
    `/users`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: ApiError) => {
        // Error deleting user
        let message = 'Failed to delete user'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete this user.'
        } else if (error.status === 404) {
          message = 'User not found. They may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

// Bulk delete users hook
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient()
  
  return useApiMutation<void, { ids: string[] }>(
    '/users/bulk-delete',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: ApiError) => {
        // Error bulk deleting users
        let message = 'Failed to delete users'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete these users.'
        } else if (error.status === 400) {
          message = 'Bad request. No users selected for deletion.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
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
  return useApiQuery<Tenant[]>(['tenants'], '/tenants', {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useTenant(id: string) {
  return useApiQuery<Tenant>(['tenants', id], `/tenants/${id}`, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  
  return useApiMutation<Tenant, Partial<Tenant>>(
    '/tenants',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
      },
      onError: (error: ApiError) => {
        // Error creating tenant
        let message = 'Failed to create tenant'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A tenant with this name already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to create tenants.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<Tenant, Partial<Tenant>>(
    `/tenants/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
        queryClient.invalidateQueries({ queryKey: ['tenants', id] })
      },
      onError: (error: ApiError) => {
        // Error updating tenant
        let message = 'Failed to update tenant'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A tenant with this name already exists.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to update this tenant.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 404) {
          message = 'Tenant not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteTenant(_id: string) {
  const queryClient = useQueryClient()
  
  return useApiDeleteWithId<void>(
    `/tenants`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
      },
      onError: (error: ApiError) => {
        // Error deleting tenant
        let message = 'Failed to delete tenant'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete this tenant.'
        } else if (error.status === 404) {
          message = 'Tenant not found. It may have been deleted.'
        } else if (error.status === 400) {
          message = error.message || 'Cannot delete tenant with associated data. Please delete all associated users and assets first.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

// Bulk delete tenants hook
export function useBulkDeleteTenants() {
  const queryClient = useQueryClient()
  
  return useApiMutation<void, { ids: string[] }>(
    '/tenants/bulk-delete',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
      },
      onError: (error: ApiError) => {
        // Error bulk deleting tenants
        let message = 'Failed to delete tenants'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete these tenants.'
        } else if (error.status === 404) {
          message = 'One or more tenants not found. They may have been deleted.'
        } else if (error.status === 400) {
          message = error.message || 'Cannot delete tenants with associated data. Please delete all associated users and assets first.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
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
  return useApiQuery<T>(['dashboard'], '/dashboard', {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export interface DashboardSummaryData {
  pc: Array<{
    cpu: string | null;
    monitorBarcode: string | null;
    upsBarcode: string | null;
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
  customFields: CustomField[];
}

export function useDashboardSummary<T = DashboardSummaryData>() {
  return useApiQuery<T>(['dashboard-summary'], '/dashboard/summary', {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

// Current user hook
export function useCurrentUser() {
  // Only make the API call if there's a token in localStorage or API client
  const hasToken = typeof window !== 'undefined' && 
    (localStorage.getItem('auth-token') || api.getToken());
  
  return useApiQuery<User>(['currentUser'], '/auth/me', {
    retry: false, // Don't retry on failure to avoid infinite loops
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    enabled: !!hasToken, // Only run the query if we have a token
  })
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
  return useApiQuery<CustomField[]>(['custom-fields', mappedModelType || 'all'], `/custom-fields${queryString}`, {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useCreateCustomField() {
  const queryClient = useQueryClient()
  
  return useApiMutation<CustomField, CustomFieldFormData>(
    '/custom-fields',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
      },
      onError: (error: ApiError) => {
        // Error creating custom field
        let message = 'Failed to create custom field'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to create custom fields.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useUpdateCustomField(id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<CustomField, CustomFieldFormData>(
    `/custom-fields/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
      },
      onError: (error: ApiError) => {
        // Error updating custom field
        let message = 'Failed to update custom field'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 403) {
          message = 'Access denied. You do not have permission to update this custom field.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 404) {
          message = 'Custom field not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteCustomField(id: string) {
  const queryClient = useQueryClient()
  
  return useApiDelete<void>(
    `/custom-fields/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
      },
      onError: (error: ApiError) => {
        // Error deleting custom field
        let message = 'Failed to delete custom field'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to delete this custom field.'
        } else if (error.status === 404) {
          message = 'Custom field not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

// Asset Custom Fields hooks
export function useAssetCustomFields(assetType: string, id: string) {
  return useApiQuery<any>(['asset-custom-fields', assetType, id], `/assets/custom-fields/${id}?assetType=${assetType}`, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

// Hook for updating asset custom fields
export function useUpdateAssetCustomFields(assetType: string, id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<any, any>(
    `/assets/custom-fields/${id}?assetType=${assetType}`,
    {
      onSuccess: () => {
        // Get current pagination parameters from cache
        const queryKeys = queryClient.getQueryCache().getAll().map(query => query.queryKey);
        
        // Refresh the main list view
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        
        // Refresh any cached pagination versions
        queryKeys.forEach(key => {
          // Check if this is a paginated assets query for this asset type
          if (Array.isArray(key) && 
              key.length > 2 && 
              key[0] === 'assets' && 
              key[1] === assetType && 
              typeof key[2] === 'string') {
            // Forcefully invalidate this specific query
            queryClient.invalidateQueries({ queryKey: key, exact: true });
            // Force a refetch of this specific query
            queryClient.refetchQueries({ queryKey: key, exact: true });
          }
        });
        
        // Invalidate the specific asset query to ensure view/edit dialogs refresh
        queryClient.invalidateQueries({ queryKey: ['assets', assetType, id] });
        
        // Invalidate custom fields queries
        queryClient.invalidateQueries({ queryKey: ['asset-custom-fields', assetType, id] });
        
        // Force a refetch of all invalidated queries to ensure data is up-to-date
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['assets', assetType] });
        }, 100);
      },
      onError: (error: ApiError) => {
        // Error updating asset custom fields
        let message = 'Failed to update asset custom fields'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to update these custom fields.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 404) {
          message = 'Asset not found. It may have been deleted.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
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
  return useApiQuery<AuditLogsSettings>(['audit-logs-settings'], '/settings/audit-logs', {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always', // Always refetch on mount for fresh data
  })
}

export function useUpdateAuditLogsSettings() {
  const queryClient = useQueryClient()
  
  return useApiUpdate<AuditLogsSettings, Partial<AuditLogsSettings>>(
    '/settings/audit-logs',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['audit-logs-settings'] })
      },
      onError: (error: ApiError) => {
        // Error updating audit logs settings
        let message = 'Failed to update audit logs settings'
        
        if (error.status === 403) {
          message = 'Access denied. You do not have permission to update audit logs settings.'
        } else if (error.status === 400) {
          message = 'Bad request. Please check the form data.'
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}