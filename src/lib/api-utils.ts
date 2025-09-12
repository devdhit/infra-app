import { NextRequest } from 'next/server'

// Standardized API response helper functions
export function successResponse<T>(data: T, status = 200) {
  try {
    console.log('Creating success response', { status, hasData: !!data });
    
    // For 204 No Content, don't send a body
    if (status === 204) {
      return new Response(null, {
        status,
        headers: {}
      })
    }
    
    const jsonData = JSON.stringify(data);
    console.log('Success response JSON created', { status, dataLength: jsonData.length });
    
    return new Response(jsonData, {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error creating success response', { error: error.message, stack: error.stack });
    throw error;
  }
}

export function errorResponse(message: string, status = 500, options?: { quiet?: boolean, details?: any, requestId?: string }) {
  // Log the error with request ID if available
  if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
    const logMessage = options?.requestId 
      ? `API Error [${status}] [Request: ${options.requestId}]: ${message}` 
      : `API Error [${status}]: ${message}`;
    console.error(logMessage, options?.details || '');
  }
  
  // Check if we're in a Next.js environment where Response is available
  if (typeof Response !== 'undefined') {
    return new Response(JSON.stringify({ 
      error: message,
      status,
      ...(options?.requestId && { requestId: options.requestId }),
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
    ...(options?.requestId && { requestId: options.requestId }),
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
    search: searchParams.get('search') || undefined, // Use undefined instead of empty string
    status: searchParams.get('status') || undefined  // Use undefined instead of empty string
  }
}