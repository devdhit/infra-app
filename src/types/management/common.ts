/**
 * Common types for management system
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

// ISO 8601 timestamp string
export type ISODateString = string;

// UUID v4 string
export type UUID = string;

/**
 * Base entity interface for all database entities
 */
export interface BaseEntity {
  readonly id: UUID;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
  readonly message?: string;
}

/**
 * API error codes
 */
export const enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
}

/**
 * Operation result type
 */
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
