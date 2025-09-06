import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { toast } from 'sonner'
import { Role, RoleFormValues } from '@/types/roles'

// Define more specific types for useRolesQuery
type RolesQueryOptions = Omit<UseQueryOptions<Role[], ApiError, Role[], string[]>, 'queryKey' | 'queryFn'>

// Generic API hook with better typing and caching
export function useRoles(options: RolesQueryOptions = {}) {
  return useQuery<Role[], ApiError, Role[], string[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get<Role[]>('/roles')
      return response
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always',
    ...options
  })
}

// Better types for mutation hooks
type RolesMutationOptions<T, V> = Omit<UseMutationOptions<T, ApiError, V, unknown>, 'mutationFn'>

// Generic mutation hook for POST requests
export function useCreateRole(options: RolesMutationOptions<Role, RoleFormValues> = {}) {
  const queryClient = useQueryClient()
  
  return useMutation<Role, ApiError, RoleFormValues>({
    mutationFn: async (data: RoleFormValues) => {
      const response = await api.post<Role, RoleFormValues>('/roles', data)
      return response
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      // Handle error
      let message = 'Failed to create role'
      
      if (error.status === 409) {
        message = 'A role with this name already exists'
      } else if (error.status === 403) {
        message = 'Access denied. You do not have permission to create roles'
      } else if (error.status === 400) {
        message = 'Bad request. Please check the form data'
      } else if (error.status === 500) {
        message = 'Server error. Please try again later'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    ...options
  })
}

// Generic mutation hook for PUT requests
export function useUpdateRole(id: string, options: RolesMutationOptions<Role, RoleFormValues> = {}) {
  const queryClient = useQueryClient()
  
  return useMutation<Role, ApiError, RoleFormValues>({
    mutationFn: async (data: RoleFormValues) => {
      const response = await api.put<Role, RoleFormValues>(`/roles/${id}`, data)
      return response
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['roles', id] })
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      // Handle error
      let message = 'Failed to update role'
      
      if (error.status === 409) {
        message = 'A role with this name already exists'
      } else if (error.status === 403) {
        message = 'Access denied. You do not have permission to update this role'
      } else if (error.status === 400) {
        message = 'Bad request. Please check the form data'
      } else if (error.status === 404) {
        message = 'Role not found. It may have been deleted'
      } else if (error.status === 500) {
        message = 'Server error. Please try again later'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    ...options
  })
}

// Generic mutation hook for DELETE requests
export function useDeleteRole(id: string, options: RolesMutationOptions<void, void> = {}) {
  const queryClient = useQueryClient()
  
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const response = await api.delete<void>(`/roles/${id}`)
      return response
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      // Handle error
      let message = 'Failed to delete role'
      
      if (error.status === 403) {
        message = 'Access denied. You do not have permission to delete this role'
      } else if (error.status === 404) {
        message = 'Role not found. It may have been deleted'
      } else if (error.status === 400) {
        message = 'Cannot delete role that is assigned to users'
      } else if (error.status === 500) {
        message = 'Server error. Please try again later'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    ...options
  })
}

// Get a specific role
export function useRole(id: string) {
  return useQuery<Role, ApiError, Role, string[]>({
    queryKey: ['roles', id],
    queryFn: async () => {
      const response = await api.get<Role>(`/roles/${id}`)
      return response
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    refetchOnMount: 'always',
  })
}