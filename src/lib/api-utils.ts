import { NextRequest } from 'next/server'
import logger from '@/lib/logger'

// Standardized API response helper functions
export function successResponse<T>(data: T, status = 200) {
  try {
    // For 204 No Content, don't send a body
    if (status === 204) {
      return new Response(null, {
        status,
        headers: {}
      })
    }
    
    const jsonData = JSON.stringify(data);
    
    return new Response(jsonData, {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    logger.error('Error creating success response', { error: error.message, stack: error.stack });
    // Return a generic error response instead of throwing
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced error response with information leakage prevention
export function errorResponse(message: string, status = 500, options?: { quiet?: boolean, details?: any, requestId?: string }) {
  // Log the full error details server-side for debugging
  if (!options?.quiet) {
    const logMessage = options?.requestId 
      ? `API Error [${status}] [Request: ${options.requestId}]: ${message}` 
      : `API Error [${status}]: ${message}`;
    
    // Log with appropriate level based on status code
    if (status >= 500) {
      logger.error(logMessage, options?.details || '');
    } else if (status >= 400) {
      logger.warn(logMessage, options?.details || '');
    } else {
      logger.info(logMessage, options?.details || '');
    }
  }
  
  // For production environments, sanitize error messages to prevent information leakage
  let sanitizedMessage = message;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In production, don't expose internal details
  if (!isDevelopment) {
    // Generic messages for common error types
    switch (status) {
      case 400:
        sanitizedMessage = 'Bad request';
        break;
      case 401:
        sanitizedMessage = 'Unauthorized';
        break;
      case 403:
        sanitizedMessage = 'Forbidden';
        break;
      case 404:
        sanitizedMessage = 'Not found';
        break;
      case 409:
        sanitizedMessage = 'Conflict';
        break;
      case 429:
        sanitizedMessage = 'Too many requests';
        break;
      case 500:
        sanitizedMessage = 'Internal server error';
        break;
      case 503:
        sanitizedMessage = 'Service temporarily unavailable';
        break;
      default:
        // For other status codes, use a generic message if the original message might contain sensitive info
        if (message.toLowerCase().includes('database') || 
            message.toLowerCase().includes('connection') || 
            message.toLowerCase().includes('prisma') ||
            message.toLowerCase().includes('sql') ||
            message.toLowerCase().includes('table') ||
            message.toLowerCase().includes('column')) {
          sanitizedMessage = 'Service temporarily unavailable';
        }
    }
  }
  
  // Check if we're in a Next.js environment where Response is available
  if (typeof Response !== 'undefined') {
    // Only include details in development environment
    const responseBody: any = { 
      error: sanitizedMessage,
      status
    };
    
    // Include request ID in all environments for tracing
    if (options?.requestId) {
      responseBody.requestId = options.requestId;
    }
    
    // Include details only in development
    if (isDevelopment && options?.details) {
      responseBody.details = options.details;
    }
    
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Fallback for Node.js environments (like tests)
  const response: any = {
    error: sanitizedMessage,
    status
  };
  
  if (options?.requestId) {
    response.requestId = options.requestId;
  }
  
  if (isDevelopment && options?.details) {
    response.details = options.details;
  }
  
  return response;
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404)
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}

export function badRequestResponse(message = 'Bad request', details?: any) {
  // Don't expose details in production to prevent information leakage
  const exposeDetails = process.env.NODE_ENV === 'development' ? details : undefined;
  return errorResponse(message, 400, { details: exposeDetails })
}

export function conflictResponse(message = 'Conflict', details?: any) {
  // Don't expose details in production to prevent information leakage
  const exposeDetails = process.env.NODE_ENV === 'development' ? details : undefined;
  return errorResponse(message, 409, { details: exposeDetails })
}

export function validationErrorResponse(errors: Record<string, string>) {
  // In production, don't expose specific validation details
  const exposeDetails = process.env.NODE_ENV === 'development' ? { 
    validationErrors: errors,
    type: 'validation' 
  } : undefined;
  
  return errorResponse('Validation failed', 400, { 
    details: exposeDetails
  })
}

// Parse request body helper with enhanced error handling
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    // Check if content type is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }
    
    return await request.json() as T
  } catch (error: any) {
    // Don't expose parsing errors that might contain sensitive information
    const sanitizedError = process.env.NODE_ENV === 'development' 
      ? `Invalid JSON in request body: ${error.message}`
      : 'Invalid request body';
    throw new Error(sanitizedError)
  }
}

// Extract query parameters with defaults and validation
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100), // Cap limit at 100
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined
  }
}