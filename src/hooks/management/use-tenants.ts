/**
 * Type-safe hooks for tenant management
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Tenant,
  TenantWithDetails,
  CreateTenantData,
  UpdateTenantData,
  TenantFilterParams,
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
 * Hook to fetch all tenants with optional filtering and pagination
 */
export function useTenants(params?: TenantFilterParams & { page?: number; limit?: number }): UseQueryResult<PaginatedResponse<Tenant>> {
  const [data, setData] = useState<PaginatedResponse<Tenant> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/tenants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<PaginatedResponse<Tenant>>>(url);
      
      // Unwrap the ApiResponse to get the actual paginated data
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenants');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tenants');
      setError(error);
      logger.error('Error fetching tenants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.page, params?.limit]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return { data, isLoading, error, refetch: fetchTenants };
}

/**
 * Hook to fetch a single tenant by ID
 */
export function useTenant(id: string): UseQueryResult<TenantWithDetails> {
  const [data, setData] = useState<TenantWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenant = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiResponse<TenantWithDetails>>(`/tenants/${id}`);
      
      // Unwrap the ApiResponse
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenant');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tenant');
      setError(error);
      logger.error('Error fetching tenant:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return { data, isLoading, error, refetch: fetchTenant };
}

/**
 * Hook to create a new tenant
 */
export function useCreateTenant(): UseMutationResult<Tenant, CreateTenantData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: CreateTenantData): Promise<Tenant> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<Tenant>, CreateTenantData>('/tenants', data);
      
      // Unwrap the ApiResponse
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create tenant');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create tenant');
      setError(error);
      logger.error('Error creating tenant:', err);
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
 * Hook to update an existing tenant
 */
export function useUpdateTenant(id: string): UseMutationResult<Tenant, UpdateTenantData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: UpdateTenantData): Promise<Tenant> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<ApiResponse<Tenant>, UpdateTenantData>(`/tenants/${id}`, data);
      
      // Unwrap the ApiResponse
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update tenant');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update tenant');
      setError(error);
      logger.error('Error updating tenant:', err);
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
 * Hook to delete a tenant
 */
export function useDeleteTenant(): UseMutationResult<void, string> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<void>(`/tenants/${id}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete tenant');
      setError(error);
      logger.error('Error deleting tenant:', err);
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
