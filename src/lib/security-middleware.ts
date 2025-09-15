import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// Security middleware to protect against common attacks
export async function securityMiddleware(request: NextRequest) {
  try {
    // Check for suspicious headers
    const userAgent = request.headers.get('user-agent') || ''
    const contentType = request.headers.get('content-type') || ''
    
    // Block requests with suspicious user agents
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nessus',
      'burp',
      'zaproxy'
    ]
    
    for (const agent of suspiciousUserAgents) {
      if (userAgent.toLowerCase().includes(agent)) {
        logger.warn('Blocked request with suspicious user agent', { userAgent })
        return errorResponse('Forbidden', 403)
      }
    }
    
    // Check for SQL injection patterns in query parameters
    const url = new URL(request.url)
    for (const [key, value] of url.searchParams) {
      if (containsSQLInjection(value)) {
        logger.warn('Blocked request with SQL injection pattern in query parameter', { key, value })
        return errorResponse('Forbidden', 403)
      }
    }
    
    // Check for SQL injection patterns in body (if JSON)
    if (contentType.includes('application/json')) {
      try {
        const body = await request.json()
        if (containsSQLInjection(JSON.stringify(body))) {
          logger.warn('Blocked request with SQL injection pattern in body', { body })
          return errorResponse('Forbidden', 403)
        }
      } catch (error) {
        // If we can't parse the body, that's fine - we'll let other middleware handle it
      }
    }
    
    // Check for XSS patterns
    for (const [key, value] of url.searchParams) {
      if (containsXSS(value)) {
        logger.warn('Blocked request with XSS pattern in query parameter', { key, value })
        return errorResponse('Forbidden', 403)
      }
    }
    
    // All checks passed
    return null
  } catch (error) {
    logger.error('Error in security middleware:', error)
    // Don't block requests due to middleware errors
    return null
  }
}

// Check for SQL injection patterns
function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/i,
    /(\bconcat\b|\bgroup_concat\b|\bload_file\b)/i,
    /('|").*('|")/,
    /(\bwaitfor\b\s+\bdelay\b)/i,
    /(\bsleep\b\s*\()/i,
    /(\/\*|\*\/|--|#)/
  ]
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return true
    }
  }
  
  return false
}

// Check for XSS patterns
function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img\b[^<]*\b(src|onerror)\b[^>]*>/gi
  ]
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return true
    }
  }
  
  return false
}

// Rate limiting middleware
export class RateLimitMiddleware {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    
    // Clean up old entries periodically
    setInterval(() => {
      const now = Date.now()
      for (const [key, timestamps] of this.requests.entries()) {
        const recent = timestamps.filter(time => now - time < this.windowMs)
        if (recent.length === 0) {
          this.requests.delete(key)
        } else {
          this.requests.set(key, recent)
        }
      }
    }, 60000) // Clean up every minute
  }
  
  async check(request: NextRequest) {
    try {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      const now = Date.now()
      const requests = this.requests.get(ip) || []
      
      // Remove requests outside the window
      const recentRequests = requests.filter(time => now - time < this.windowMs)
      
      // Check if limit exceeded
      if (recentRequests.length >= this.maxRequests) {
        return errorResponse('Too many requests. Please try again later.', 429)
      }
      
      // Add current request
      recentRequests.push(now)
      this.requests.set(ip, recentRequests)
      
      return null
    } catch (error) {
      logger.error('Error in rate limit middleware:', error)
      // Don't block requests due to middleware errors
      return null
    }
  }
}

// Create a global rate limiter instance
export const globalRateLimiter = new RateLimitMiddleware(60000, 100) // 100 requests per minute

// Create a stricter rate limiter for auth endpoints
export const authRateLimiter = new RateLimitMiddleware(60000, 10) // 10 requests per minute for auth