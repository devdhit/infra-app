import { hash, compare } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// Generate a cryptographically secure random token
export function generateToken(length: number = 32): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Generate a secure random string for cryptographic purposes
export function generateSecureRandomString(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced password strength validation
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 12) {
    return { isValid: false, message: 'Password must be at least 12 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  // Check for common password patterns
  const commonPatterns = [
    /password/i,
    /123456/i,
    /qwerty/i,
    /abc123/i
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, message: 'Password contains common weak patterns' };
    }
  }
  
  return { isValid: true, message: 'Password is valid' };
}

// Rate limiting utility with improved security
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  isAllowed(ip: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(ip) || [];
    
    // Remove requests outside the window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    
    return true;
  }
  
  // Reset rate limiter for an IP
  reset(ip: string): void {
    this.requests.delete(ip);
  }
  
  // Get current request count for an IP
  getRequestCount(ip: string): number {
    const now = Date.now();
    const requests = this.requests.get(ip) || [];
    return requests.filter(time => now - time < this.windowMs).length;
  }
}

// Enhanced Content Security Policy
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

// Validate and sanitize search input to prevent injection attacks
export function validateSearchInput(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  let sanitized = input.replace(/[^a-zA-Z0-9\s\-_@.]/g, '');
  
  // Limit length to prevent resource exhaustion
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized.trim();
}

// Validate and sanitize Office information to preserve version details
export function validateOfficeInput(input: string): string {
  if (!input) return '';
  
  // Allow common characters in Office version strings including / and ()
  let sanitized = input.replace(/[^a-zA-Z0-9\s\-_@./()]/g, '');
  
  // Limit length to prevent resource exhaustion
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized.trim();
}

// Create a hash for data integrity verification
export function createDataHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}