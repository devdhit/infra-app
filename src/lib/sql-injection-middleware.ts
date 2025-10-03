import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// Enhanced SQL injection detection patterns
const SQL_INJECTION_PATTERNS = [
  // SQL keywords
  /\b(union|select|insert|update|delete|drop|create|alter|exec|execute|declare|cast|convert|truncate|merge|into)\b/i,
  // SQL functions and expressions
  /\b(concat|group_concat|load_file|benchmark|sleep|waitfor|delay|extractvalue|updatexml|chr|char|ascii|substring|mid|instr|lpad|rpad)\b/i,
  // SQL comments
  /(--|#|\/\*|\*\/)/,
  // SQL operators that could be used maliciously
  /(\b(or|and)\b\s*\d+\s*=\s*\d+)/i,
  // Hexadecimal encoding attempts
  /0x[0-9a-f]+/i,
  // Multiple dots (potential object traversal)
  /(\.){2,}/,
  // Multiple slashes (potential path traversal)
  /(\/){2,}/,
  // Escaped quotes
  /\\['"]/,
  // Stack queries
  /;\s*(select|insert|update|delete|drop|create|alter|exec|execute|declare)/i,
  // Boolean-based SQL injection
  /\b(1=1|1=0|0=0|or\s+\d+=\d+)\b/i,
  // Time-based SQL injection
  /\b(sleep|benchmark|waitfor)\s*\(\s*\d+\s*\)/i,
  // Error-based SQL injection
  /\b(extractvalue|updatexml)\s*\(/i
];

// Suspicious characters that may indicate injection attempts
const SUSPICIOUS_CHARACTERS = [
  "'",
  '"',
  ';',
  '--',
  '/*',
  '*/',
  '#',
  '=',
  '(',
  ')',
  '|',
  '&',
  '^',
  '~'
];

// Check if input contains SQL injection patterns
function containsSQLInjection(input: string): boolean {
  if (!input) return false;
  
  // Convert to lowercase for case-insensitive matching
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      logger.warn('SQL injection pattern detected', { 
        pattern: pattern.toString(), 
        input: normalizedInput.substring(0, 100) + (normalizedInput.length > 100 ? '...' : '') 
      });
      return true;
    }
  }
  
  // Check for excessive suspicious characters
  let suspiciousCharCount = 0;
  for (const char of SUSPICIOUS_CHARACTERS) {
    const matches = normalizedInput.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    if (matches) {
      suspiciousCharCount += matches.length;
    }
  }
  
  // If more than 30% of characters are suspicious, flag as potential injection
  if (normalizedInput.length > 0 && (suspiciousCharCount / normalizedInput.length) > 0.3) {
    logger.warn('High density of suspicious characters detected', { 
      suspiciousCharCount, 
      inputLength: normalizedInput.length,
      input: normalizedInput.substring(0, 100) + (normalizedInput.length > 100 ? '...' : '')
    });
    return true;
  }
  
  return false;
}

// Validate and sanitize database identifiers (table names, column names)
function validateDatabaseIdentifier(identifier: string): boolean {
  if (!identifier) return false;
  
  // Only allow alphanumeric characters, underscores, and dots (for schema qualification)
  const validIdentifier = /^[a-zA-Z0-9_.]+$/.test(identifier);
  
  if (!validIdentifier) {
    logger.warn('Invalid database identifier detected', { identifier });
    return false;
  }
  
  // Check length
  if (identifier.length > 64) {
    logger.warn('Database identifier too long', { identifier, length: identifier.length });
    return false;
  }
  
  return true;
}

// SQL Injection Middleware
export async function sqlInjectionMiddleware(request: NextRequest) {
  try {
    // Check query parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams) {
      // Skip validation for known safe parameters
      const safeParams = ['page', 'limit', 'sort', 'order'];
      if (safeParams.includes(key)) continue;
      
      if (containsSQLInjection(value)) {
        logger.warn('SQL injection attempt detected in query parameter', { key, value });
        return errorResponse('Invalid input detected', 400);
      }
    }
    
    // Check request body for JSON content
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const bodyText = await request.text();
        if (bodyText) {
          // Parse and check the JSON body
          const body = JSON.parse(bodyText);
          
          // Recursively check all string values in the body
          function checkObject(obj: any): boolean {
            if (typeof obj === 'string') {
              return containsSQLInjection(obj);
            }
            
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                  if (checkObject(obj[key])) {
                    return true;
                  }
                }
              }
            }
            
            return false;
          }
          
          if (checkObject(body)) {
            logger.warn('SQL injection attempt detected in request body');
            return errorResponse('Invalid input detected', 400);
          }
        }
      } catch (error) {
        // If we can't parse the body, continue with other checks
        logger.debug('Could not parse request body as JSON', { error });
      }
    }
    
    // Additional checks for dynamic database operations
    // Check for table/column name parameters in query
    const tableName = url.searchParams.get('table');
    const columnName = url.searchParams.get('column');
    
    if (tableName && !validateDatabaseIdentifier(tableName)) {
      logger.warn('Invalid table name in query parameters', { tableName });
      return errorResponse('Invalid table name', 400);
    }
    
    if (columnName && !validateDatabaseIdentifier(columnName)) {
      logger.warn('Invalid column name in query parameters', { columnName });
      return errorResponse('Invalid column name', 400);
    }
    
    // All checks passed
    return null;
  } catch (error) {
    logger.error('Error in SQL injection middleware', { error });
    // Don't block requests due to middleware errors, but log them
    return null;
  }
}

export default sqlInjectionMiddleware;