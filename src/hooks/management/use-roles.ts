/**
 * Type-safe hooks for role management
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Role,
  RoleWithUsers,
  CreateRoleData,
  UpdateRoleData,
  PaginatedResponse,
  ApiResponse,
} from '@/types/management';
import logger from '@/lib/logger';

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to fetch all roles with optional filtering and pagination
 */
export function useRoles(params?: { search?: string; page?: number; limit?: number }): UseQueryResult<PaginatedResponse<Role>> {
  const [data, setData] = useState<PaginatedResponse<Role> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<PaginatedResponse<Role>>>(url);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch roles');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch roles');
      setError(error);
      logger.error('Error fetching roles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.page, params?.limit]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { data, isLoading, error, refetch: fetchRoles };
}

/**
 * Hook to fetch a single role by ID
 */
export function useRole(id: string): UseQueryResult<RoleWithUsers> {
  const [data, setData] = useState<RoleWithUsers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<RoleWithUsers>(`/roles/${id}`);
      setData(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch role');
      setError(error);
      logger.error('Error fetching role:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return { data, isLoading, error, refetch: fetchRole };
}

/**
 * Hook to create a new role
 */
export function useCreateRole(): UseMutationResult<Role, CreateRoleData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: CreateRoleData): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<Role, CreateRoleData>('/roles', data);
      // Notify listeners that roles have been updated
      window.dispatchEvent(new Event('roles-updated'));
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create role');
      setError(error);
      logger.error('Error creating role:', err);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { mutate, isLoading, error, reset };
}

/**
 * Hook to update an existing role
 */
export function useUpdateRole(id: string): UseMutationResult<Role, UpdateRoleData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: UpdateRoleData): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<Role, UpdateRoleData>(`/roles/${id}`, data);
      // Notify listeners that roles have been updated
      window.dispatchEvent(new Event('roles-updated'));
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update role');
      setError(error);
      logger.error('Error updating role:', err);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { mutate, isLoading, error, reset };
}

/**
 * Hook to delete a role
 */
export function useDeleteRole(): UseMutationResult<void, string> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<void>(`/roles/${id}`);
      // Notify listeners that roles have been updated
      window.dispatchEvent(new Event('roles-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete role');
      setError(error);
      logger.error('Error deleting role:', err);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { mutate, isLoading, error, reset };
}

/**
 * Hook for bulk delete roles
 */
export function useBulkDeleteRoles(): UseMutationResult<void, string[]> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (ids: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post<void, { ids: string[] }>('/roles/bulk-delete', { ids });
      // Notify listeners that roles have been updated
      window.dispatchEvent(new Event('roles-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete roles');
      setError(error);
      logger.error('Error bulk deleting roles:', err);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return { mutate, isLoading, error, reset };
}
