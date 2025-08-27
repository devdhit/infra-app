import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, ValidationError } from '@/lib/api'
import { toast } from 'sonner'

// Generic API hook
export function useApiQuery<T>(key: string[], url: string, options = {}) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<T>(url)
      return response
    },
    ...options
  })
}

// Generic mutation hook for POST requests
export function useApiMutation<T, V>(url: string, options = {}) {
  const queryClient = useQueryClient()
  
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
  const queryClient = useQueryClient()
  
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
  const queryClient = useQueryClient()
  
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
    ...options
  })
}

// Asset-specific hooks
export function useAssets<T>(assetType: string, params: Record<string, any> = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `/assets/${assetType}${queryString ? `?${queryString}` : ''}`
  
  // Convert params object to a string for the query key to ensure it's serializable
  const paramsKey = JSON.stringify(params)
  
  return useApiQuery<T>(['assets', assetType, paramsKey], url)
}

export function useAsset<T>(assetType: string, id: string) {
  return useApiQuery<T>(['assets', assetType, id], `/assets/${assetType}/${id}`)
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
    `/assets/${assetType}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
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

export function useUsers() {
  return useApiQuery<User[]>(['users'], '/users')
}

export function useUser(id: string) {
  return useApiQuery<User>(['users', id], `/users/${id}`)
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useApiMutation<User, Partial<User>>(
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
  
  return useApiUpdate<User, Partial<User>>(
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
  
  return useApiDelete<void>(
    `/users/${id}`,
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

// Tenant hooks
export interface Tenant {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
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
  
  return useApiDelete<void>(
    `/tenants/${id}`,
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

export function useDashboard() {
  return useApiQuery<DashboardData>(['dashboard'], '/dashboard')
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
    onError: (error: ApiError) => {
      console.error('Error fetching current user:', error)
      let message = 'Failed to fetch user information'
      
      if (error.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  })
}