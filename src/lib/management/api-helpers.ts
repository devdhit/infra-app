/**
 * API Route Handlers with Type Safety
 * Helper functions for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { ApiResponse } from '@/types/management';
import logger from '@/lib/logger';

type ErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR' | 'BAD_REQUEST';

/**
 * Success response helper
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function apiError(
  message: string,
  code: ErrorCode = 'INTERNAL_ERROR',
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Unauthorized response
 */
export function apiUnauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse<never>> {
  return apiError(message, 'UNAUTHORIZED', 401);
}

/**
 * Forbidden response
 */
export function apiForbidden(message: string = 'Forbidden'): NextResponse<ApiResponse<never>> {
  return apiError(message, 'FORBIDDEN', 403);
}

/**
 * Not found response
 */
export function apiNotFound(message: string = 'Resource not found'): NextResponse<ApiResponse<never>> {
  return apiError(message, 'NOT_FOUND', 404);
}

/**
 * Bad request response
 */
export function apiBadRequest(message: string, details?: Record<string, unknown>): NextResponse<ApiResponse<never>> {
  return apiError(message, 'BAD_REQUEST', 400, details);
}

/**
 * Validation error response
 */
export function apiValidationError(
  message: string,
  errors: readonly { field: string; message: string }[]
): NextResponse<ApiResponse<never>> {
  return apiError(
    message,
    'VALIDATION_ERROR',
    400,
    { validationErrors: errors }
  );
}

/**
 * Conflict response
 */
export function apiConflict(message: string): NextResponse<ApiResponse<never>> {
  return apiError(message, 'CONFLICT', 409);
}

/**
 * Check authentication middleware
 */
export async function checkAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { user: null, error: apiUnauthorized() };
  }
  return { user, error: null };
}

/**
 * Check permission middleware
 */
export async function checkPermission(
  request: NextRequest,
  resource: string,
  action: string
) {
  const { user, error } = await checkAuth(request);
  if (error) return { user: null, error };

  if (!user || !user.role?.id) {
    return { user: null, error: apiForbidden('User role information missing') };
  }

  const hasAccess = await hasPermission(
    user.role.id,
    user.tenantId,
    resource,
    action
  );

  if (!hasAccess) {
    return { user: null, error: apiForbidden(`Insufficient permissions for ${resource}:${action}`) };
  }

  return { user, error: null };
}

/**
 * Parse request body with error handling
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<{
  data: T | null;
  error: NextResponse<ApiResponse<never>> | null;
}> {
  try {
    const data = await request.json() as T;
    return { data, error: null };
  } catch (error) {
    logger.error('Failed to parse request body:', error);
    return {
      data: null,
      error: apiBadRequest('Invalid JSON in request body'),
    };
  }
}

/**
 * API route handler wrapper with error handling
 */
export function withErrorHandling<T>(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request);
    } catch (error: unknown) {
      logger.error('API route error:', error);
      return apiError(
        'Internal server error',
        'INTERNAL_ERROR',
        500
      ) as NextResponse<ApiResponse<T>>;
    }
  };
}
