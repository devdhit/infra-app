import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Define custom error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
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
    return response
  },
  (error: unknown) => {
    // Handle common error responses
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        window.location.href = '/auth/login'
      }
    }
    
    // Create a custom error with more details
    const apiError = new ApiError(
      axios.isAxiosError(error) ? error.response?.status || 500 : 500,
      axios.isAxiosError(error) ? 
        error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred' :
        'An unexpected error occurred',
      axios.isAxiosError(error) ? error.response?.data : undefined
    )
    
    return Promise.reject(apiError)
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
      const response = await apiClient.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
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