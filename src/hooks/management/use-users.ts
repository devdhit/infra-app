/**
 * Type-safe hooks for user management
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  User,
  UserWithRole,
  CreateUserData,
  UpdateUserData,
  UserFilterParams,
  PasswordChangeData,
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
 * Hook to fetch all users with optional filtering and pagination
 */
export function useUsers(params?: UserFilterParams & { isActive?: boolean; page?: number; limit?: number }): UseQueryResult<PaginatedResponse<UserWithRole>> {
  const [data, setData] = useState<PaginatedResponse<UserWithRole> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.roleId) queryParams.append('roleId', params.roleId);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<PaginatedResponse<UserWithRole>>>(url);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch users');
      setError(error);
      logger.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.roleId, params?.isActive, params?.page, params?.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, isLoading, error, refetch: fetchUsers };
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string): UseQueryResult<UserWithRole> {
  const [data, setData] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<UserWithRole>(`/users/${id}`);
      setData(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user');
      setError(error);
      logger.error('Error fetching user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { data, isLoading, error, refetch: fetchUser };
}

/**
 * Hook to create a new user
 */
export function useCreateUser(): UseMutationResult<User, CreateUserData & { password: string }> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: CreateUserData & { password: string }): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<User, CreateUserData & { password: string }>('/users', data);
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create user');
      setError(error);
      logger.error('Error creating user:', err);
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
 * Hook to update an existing user
 */
export function useUpdateUser(id: string): UseMutationResult<User, UpdateUserData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: UpdateUserData): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<User, UpdateUserData>(`/users/${id}`, data);
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update user');
      setError(error);
      logger.error('Error updating user:', err);
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
 * Hook to delete a user
 */
export function useDeleteUser(): UseMutationResult<void, string> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete<void>(`/users/${id}`);
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete user');
      setError(error);
      logger.error('Error deleting user:', err);
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
 * Hook to bulk delete users
 */
export function useBulkDeleteUsers(): UseMutationResult<void, string[]> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (ids: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use POST for bulk delete with ids in the body
      await api.post<void, { ids: string[] }>(`/users/bulk-delete`, { ids });
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete users');
      setError(error);
      logger.error('Error deleting users:', err);
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
 * Hook to change user password
 */
export function useChangePassword(userId: string): UseMutationResult<void, PasswordChangeData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: PasswordChangeData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post<void, PasswordChangeData>(`/users/${userId}/change-password`, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to change password');
      setError(error);
      logger.error('Error changing password:', err);
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
 * Hook to lock a user account
 */
export function useLockUser(): UseMutationResult<void, string> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post<void, Record<string, never>>(`/users/${userId}/lock`, {});
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to lock user');
      setError(error);
      logger.error('Error locking user:', err);
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
 * Hook to unlock a user account
 */
export function useUnlockUser(): UseMutationResult<void, string> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post<void, Record<string, never>>(`/users/${userId}/unlock`, {});
      // Notify listeners that users have been updated
      window.dispatchEvent(new Event('users-updated'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unlock user');
      setError(error);
      logger.error('Error unlocking user:', err);
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
