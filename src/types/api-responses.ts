// Define common API response interfaces for consistency across the application
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, string>;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  validationErrors: Record<string, string>;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Union type for all possible API responses
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse | ValidationErrorResponse;

// Specific response types for common operations
export interface CreatedResponse<T> extends SuccessResponse<T> {
  statusCode: 201;
}

export interface NoContentResponse {
  success: true;
  data: null;
  statusCode: 204;
}