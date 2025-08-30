import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { api, ApiError, ValidationError } from '@/lib/api'
import { toast } from 'sonner'
import { getModelType } from '@/lib/custom-fields'

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
    // Implement staleTime for better caching
    staleTime: 5 * 60 * 1000, // 5 minutes by default
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnReconnect: false, // Reduce unnecessary refetches
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
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options
  })
}

export function useAsset<T>(assetType: string, id: string) {
  return useApiQuery<T>(['assets', assetType, id], `/assets/${assetType}/${id}`, {
    // Individual asset data can be cached for a moderate time
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        console.error(`Error creating ${assetType}:`, error)
        let message = `Failed to create ${assetType}`
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'An asset with this identifier already exists.'
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
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
        queryClient.invalidateQueries({ queryKey: ['assets', assetType, id] })
      },
      onError: (error: ApiError) => {
        console.error(`Error updating ${assetType} with id ${id}:`, error)
        let message = `Failed to update ${assetType}`
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'An asset with this identifier already exists.'
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
        console.error(`Error deleting ${assetType}:`, error)
        let message = `Failed to delete ${assetType}`
        
        if (error.message) {
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
        console.error(`Error bulk deleting ${assetType}:`, error)
        let message = `Failed to delete ${assetType} assets`
        
        if (error.message) {
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
      }
      // Invalidate all queries to refresh the app state
      queryClient.invalidateQueries()
    },
    onError: (error: ApiError) => {
      console.error('Login error:', error)
      let message = 'Login failed'
      
      if (error.status === 401) {
        message = 'Invalid email or password'
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
      console.error('Logout error:', error)
      let message = 'Logout failed'
      
      if (error.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  })
}

// User hooks
export interface User {
  id: string
  email: string
  name: string
  role: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// Interface for user creation/update (includes password)
export interface UserCreateUpdate extends User {
  password?: string
}

export function useUsers() {
  return useApiQuery<User[]>(['users'], '/users')
}

export function useUser(id: string) {
  return useApiQuery<User>(['users', id], `/users/${id}`)
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
        console.error('Error creating user:', error)
        let message = 'Failed to create user'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A user with this email already exists.'
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
        console.error(`Error updating user with id ${id}:`, error)
        let message = 'Failed to update user'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A user with this email already exists.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient()
  
  return useApiDeleteWithId<void>(
    `/users`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
      onError: (error: ApiError) => {
        console.error(`Error deleting user with id ${id}:`, error)
        let message = 'Failed to delete user'
        
        if (error.message) {
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
        console.error('Error bulk deleting users:', error)
        let message = 'Failed to delete users'
        
        if (error.message) {
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
  }
}

export function useTenants() {
  return useApiQuery<Tenant[]>(['tenants'], '/tenants')
}

export function useTenant(id: string) {
  return useApiQuery<Tenant>(['tenants', id], `/tenants/${id}`)
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
        console.error('Error creating tenant:', error)
        let message = 'Failed to create tenant'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A tenant with this name already exists.'
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
        console.error(`Error updating tenant with id ${id}:`, error)
        let message = 'Failed to update tenant'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
        } else if (error.status === 409) {
          message = 'A tenant with this name already exists.'
        } else if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

export function useDeleteTenant(id: string) {
  const queryClient = useQueryClient()
  
  return useApiDeleteWithId<void>(
    `/tenants`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
      },
      onError: (error: ApiError) => {
        console.error(`Error deleting tenant with id ${id}:`, error)
        let message = 'Failed to delete tenant'
        
        if (error.message) {
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
        console.error('Error bulk deleting tenants:', error)
        let message = 'Failed to delete tenants'
        
        if (error.message) {
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
  return useApiQuery<T>(['dashboard'], '/dashboard')
}

// Current user hook
export function useCurrentUser() {
  // Only make the API call if there's a token in localStorage or API client
  const hasToken = typeof window !== 'undefined' && 
    (localStorage.getItem('auth-token') || api.getToken());
  
  return useApiQuery<User>(['currentUser'], '/auth/me', {
    retry: false, // Don't retry on failure to avoid infinite loops
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
  return useApiQuery<CustomField[]>(['custom-fields', mappedModelType || 'all'], `/custom-fields${queryString}`)
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
        console.error('Error creating custom field:', error)
        let message = 'Failed to create custom field'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
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
        console.error(`Error updating custom field with id ${id}:`, error)
        let message = 'Failed to update custom field'
        
        if (error instanceof ValidationError) {
          message = 'Validation failed. Please check the form for errors.'
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
        console.error(`Error deleting custom field with id ${id}:`, error)
        let message = 'Failed to delete custom field'
        
        if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}

// Asset Custom Fields hooks
export function useAssetCustomFields(assetType: string, id: string) {
  return useApiQuery<any>(['asset-custom-fields', assetType, id], `/assets/custom-fields/${id}?assetType=${assetType}`)
}

export function useUpdateAssetCustomFields(assetType: string, id: string) {
  const queryClient = useQueryClient()
  
  return useApiUpdate<any, any>(
    `/assets/custom-fields/${id}?assetType=${assetType}`,
    {
      onSuccess: () => {
        // Invalidate asset list queries
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
        
        // Invalidate the specific asset query to ensure view/edit dialogs refresh
        queryClient.invalidateQueries({ queryKey: ['assets', assetType, id] })
        
        // Invalidate custom fields queries
        queryClient.invalidateQueries({ queryKey: ['asset-custom-fields', assetType, id] })
      },
      onError: (error: ApiError) => {
        console.error(`Error updating asset custom fields for ${assetType} with id ${id}:`, error)
        let message = 'Failed to update asset custom fields'
        
        if (error.message) {
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
  return useApiQuery<AuditLogsSettings>(['audit-logs-settings'], '/settings/audit-logs')
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
        console.error('Error updating audit logs settings:', error)
        let message = 'Failed to update audit logs settings'
        
        if (error.message) {
          message = error.message
        }
        
        toast.error(message)
      }
    }
  )
}