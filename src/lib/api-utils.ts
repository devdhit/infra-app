import { NextRequest } from 'next/server'

// Standardized API response helper functions
export function successResponse<T>(data: T, status = 200) {
  // For 204 No Content, don't send a body
  if (status === 204) {
    return new Response(null, {
      status,
      headers: {}
    })
  }
  
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function errorResponse(message: string, status = 500, options?: { quiet?: boolean, details?: any }) {
  if (!options?.quiet && process.env.NODE_ENV === 'development') {
    console.error(`API Error [${status}]: ${message}`, options?.details || '');
  }
  
  // Check if we're in a Next.js environment where Response is available
  if (typeof Response !== 'undefined') {
    return new Response(JSON.stringify({ 
      error: message,
      status,
      ...(options?.details && { details: options.details })
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Fallback for Node.js environments (like tests)
  return {
    error: message,
    status,
    ...(options?.details && { details: options.details })
  } as any;
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404)
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}

export function badRequestResponse(message = 'Bad request', details?: any) {
  return errorResponse(message, 400, { details })
}

export function conflictResponse(message = 'Conflict', details?: any) {
  return errorResponse(message, 409, { details })
}

export function validationErrorResponse(errors: Record<string, string>) {
  return errorResponse('Validation failed', 400, { 
    details: { 
      validationErrors: errors,
      type: 'validation' 
    } 
  })
}

// Parse request body helper
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    // Check if content type is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }
    
    return await request.json() as T
  } catch (error: any) {
    throw new Error(`Invalid JSON in request body: ${error.message}`)
  }
}

// Extract query parameters with defaults
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || ''
  }
}