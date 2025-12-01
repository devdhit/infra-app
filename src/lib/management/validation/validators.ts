/**
 * Validation helper functions
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { ZodSchema, ZodError } from 'zod';
import { ValidationErrorDetail } from '@/types/management';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: readonly ValidationErrorDetail[];
}

/**
 * Validate data against a Zod schema
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errors: ValidationErrorDetail[] = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: [
        {
          field: 'unknown',
          message: 'Validation failed with unknown error',
        },
      ],
    };
  }
}

/**
 * Validate data and throw if invalid
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    const error = new Error('Validation failed');
    (error as Error & { errors: readonly ValidationErrorDetail[] }).errors = result.errors || [];
    throw error;
  }
  return result.data as T;
}

/**
 * Safe parse with error handling
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { readonly success: true; readonly data: T } | { readonly success: false; readonly error: string } {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation failed',
      };
    }
    return {
      success: false,
      error: 'Validation failed with unknown error',
    };
  }
}

/**
 * Create a validation error message from Zod errors
 */
export function formatValidationErrors(errors: readonly ValidationErrorDetail[]): string {
  return errors.map((err) => `${err.field}: ${err.message}`).join('; ');
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is Error & { errors: readonly ValidationErrorDetail[] } {
  return error instanceof Error && 'errors' in error && Array.isArray((error as Error & { errors: unknown }).errors);
}
