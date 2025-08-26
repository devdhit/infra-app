import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

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
  
  return useMutation<T, Error, V>({
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
  
  return useMutation<T, Error, V>({
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
  
  return useMutation<T, Error, string>({ // Changed void to string for ID parameter
    mutationFn: async (id: string) => { // Accept ID parameter
      const deleteUrl = id ? `${url}/${id}` : url // Append ID to URL if provided
      const response = await api.delete<T>(deleteUrl)
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
      }
    }
  )
}

export function useDeleteAsset<T>(assetType: string) {
  const queryClient = useQueryClient()
  
  return useApiDelete<T>(
    `/assets/${assetType}`, // This will be used as the base URL
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] })
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