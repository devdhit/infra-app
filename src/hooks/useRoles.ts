import { api, ApiError } from '@/lib/api'
import { Role, RoleFormValues } from '@/types/roles'
import { useState, useEffect, useCallback } from 'react'

// Generic API hook with direct API calls instead of React Query
export function useRoles() {
  const [data, setData] = useState<Role[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get<Role[]>('/roles')
      setData(response)
    } catch (err) {
      setError(err as ApiError)
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, isLoading, error, refetch: fetchData }
}

// Generic mutation hook for POST requests
export function useCreateRole() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const mutate = async (data: RoleFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.post<Role, RoleFormValues>('/roles', data)
      return response
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  
  return { mutate, isLoading, error }
}

// Generic mutation hook for PUT requests
export function useUpdateRole(id: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const mutate = async (data: RoleFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.put<Role, RoleFormValues>(`/roles/${id}`, data)
      return response
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  
  return { mutate, isLoading, error }
}

// Generic mutation hook for DELETE requests
export function useDeleteRole(id: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const mutate = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.delete<void>(`/roles/${id}`)
      return response
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  
  return { mutate, isLoading, error }
}

// Bulk delete roles hook
export function useBulkDeleteRoles() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const mutate = async ({ ids }: { ids: string[] }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.post<void, { ids: string[] }>('/roles/bulk-delete', { ids })
      return response
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  
  return { mutate, isLoading, error }
}

// Get a specific role
export function useRole(id: string) {
  const [data, setData] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get<Role>(`/roles/${id}`)
      setData(response)
    } catch (err) {
      setError(err as ApiError)
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, isLoading, error, refetch: fetchData }
}