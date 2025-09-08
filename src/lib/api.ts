import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Define custom error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  public validationErrors: Record<string, string>
  
  constructor(
    message: string,
    validationErrors: Record<string, string>,
    data?: unknown
  ) {
    super(400, message, data)
    this.name = 'ValidationError'
    this.validationErrors = validationErrors
  }
}

// Create an axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        } as any
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: unknown) => {
    // Handle common error responses
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Clear token and redirect to login if unauthorized
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }
        }
      } else if (error.response?.status === 403) {
        // For forbidden access, show a toast message instead of logging out
        if (typeof window !== 'undefined') {
          // Don't redirect, just show an error message
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action';
          // We can't use toast here directly because it's not available in this file
          // The error will be handled by the calling component
          // Using errorMessage to prevent TypeScript error
          console.warn('403 Forbidden -', errorMessage);
        }
      }
    }
    
    // Create appropriate error based on response
    let apiError: ApiError;
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
      const errorData = error.response?.data;
      
      // Check if it's a validation error
      if (status === 400 && errorData?.details?.type === 'validation') {
        apiError = new ValidationError(
          errorMessage,
          errorData.details.validationErrors,
          errorData
        );
      } else {
        apiError = new ApiError(status, errorMessage, errorData);
      }
    } else {
      apiError = new ApiError(500, 'An unexpected error occurred', undefined);
    }
    
    return Promise.reject(apiError);
  }
)

// Wrapper functions for common HTTP methods
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config)
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  post: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    try {
      // Log request for debugging permission checks
      if (url.includes('permissions/check')) {
        console.log('Sending permission check request:', { url, data, config });
        // Ensure we have valid data
        if (!data || Object.keys(data).length === 0) {
          console.warn('Empty data being sent to permissions check - preventing request');
          throw new Error('Permission check requires resource and action parameters');
        }
      }
      
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  put: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  delete: async <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  // Special post method for Excel imports with extended timeout
  postExcelImport: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    try {
      // Create a separate axios instance with extended timeout for Excel imports
      const importClient = axios.create({
        baseURL: '/api',
        timeout: 300000, // Increased to 5 minutes timeout for large imports
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Apply the same interceptors
      importClient.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          // Add auth token if available
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth-token')
            if (token) {
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`
              } as any
            }
          }
          return config
        },
        (error: AxiosError) => {
          return Promise.reject(error)
        }
      );
      
      importClient.interceptors.response.use(
        (response: AxiosResponse) => {
          return response;
        },
        (error: unknown) => {
          // Handle common error responses
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              // Clear token and redirect to login if unauthorized
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-token');
                // Only redirect if we're not already on the login page
                if (window.location.pathname !== '/auth/login') {
                  window.location.href = '/auth/login';
                }
              }
            } else if (error.response?.status === 403) {
              // For forbidden access, show a toast message instead of logging out
              if (typeof window !== 'undefined') {
                // Don't redirect, just show an error message
                const errorMessage = error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action';
                // We can't use toast here directly because it's not available in this file
                // The error will be handled by the calling component
                // Using errorMessage to prevent TypeScript error
                console.warn('403 Forbidden -', errorMessage);
              }
            }
          }
          
          // Create appropriate error based on response
          let apiError: ApiError;
          
          if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
            const errorData = error.response?.data;
            
            // Check if it's a validation error
            if (status === 400 && errorData?.details?.type === 'validation') {
              apiError = new ValidationError(
                errorMessage,
                errorData.details.validationErrors,
                errorData
              );
            } else {
              apiError = new ApiError(status, errorMessage, errorData);
            }
          } else {
            apiError = new ApiError(500, 'An unexpected error occurred', undefined);
          }
          
          return Promise.reject(apiError);
        }
      );
      
      const response = await importClient.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  // Helper function to set token
  setToken: (token: string | null) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', token)
      }
    } else {
      delete apiClient.defaults.headers.common['Authorization']
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
      }
    }
  },
  
  // Helper function to get token
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token')
    }
    return null
  }
}

export default apiClient