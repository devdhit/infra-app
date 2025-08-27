import { NextRequest } from 'next/server'

// Standardized API response helper functions
export function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function errorResponse(message: string, status = 500, options?: { quiet?: boolean }) {
  if (!options?.quiet) {
    console.error(`API Error [${status}]: ${message}`);
  }
  
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404)
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}

export function badRequestResponse(message = 'Bad request') {
  return errorResponse(message, 400)
}

// Parse request body helper
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json() as T
  } catch (error) {
    throw new Error('Invalid JSON in request body')
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