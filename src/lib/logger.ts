/**
 * Environment-aware logging utility
 * Logs info, warnings, and errors in production, debug only in development
 */

// Helper function to get formatted timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Type for structured log data
interface LogData {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

/**
 * Main logging function that respects environment settings
 * @param level Log level
 * @param message Log message
 * @param optionalParams Additional parameters to log
 */
function log(level: LogLevel, message: any, ...optionalParams: any[]) {
  // In production, only log info, warnings, and errors (not debug)
  // But we want to show info-level messages in production as per requirements
  if (!isDevelopment && level === 'debug') {
    return;
  }

  // Check if we have structured log data as the first parameter
  let structuredData: LogData | undefined;
  const logMessage = message;
  
  if (optionalParams.length > 0 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null) {
    const firstParam = optionalParams[0];
    if (firstParam.requestId || firstParam.userId || firstParam.tenantId || firstParam.component) {
      structuredData = firstParam;
      // Remove the structured data from optionalParams
      optionalParams = optionalParams.slice(1);
    }
  }

  // Format the message with timestamp, log level, and structured data
  let formattedMessage = `[${getTimestamp()}] ${level.toUpperCase()}`;
  
  if (structuredData) {
    if (structuredData.requestId) {
      formattedMessage += ` [Request: ${structuredData.requestId}]`;
    }
    if (structuredData.userId) {
      formattedMessage += ` [User: ${structuredData.userId}]`;
    }
    if (structuredData.tenantId) {
      formattedMessage += ` [Tenant: ${structuredData.tenantId}]`;
    }
    if (structuredData.component) {
      formattedMessage += ` [Component: ${structuredData.component}]`;
    }
  }
  
  formattedMessage += `: ${logMessage}`;
  
  // Always log info, warn, and error messages in production
  switch (level) {
    case 'debug':
      console.log(formattedMessage, ...optionalParams);
      break;
    case 'info':
      console.log(formattedMessage, ...optionalParams);
      break;
    case 'warn':
      console.warn(formattedMessage, ...optionalParams);
      break;
    case 'error':
      console.error(formattedMessage, ...optionalParams);
      break;
  }
}

/**
 * Log debug messages (only in development)
 */
export function debug(message: any, ...optionalParams: any[]) {
  log('debug', message, ...optionalParams);
}

/**
 * Log info messages (in both development and production)
 */
export function info(message: any, ...optionalParams: any[]) {
  log('info', message, ...optionalParams);
}

/**
 * Log warning messages (in both development and production)
 */
export function warn(message: any, ...optionalParams: any[]) {
  log('warn', message, ...optionalParams);
}

/**
 * Log error messages (in both development and production)
 */
export function error(message: any, ...optionalParams: any[]) {
  log('error', message, ...optionalParams);
}

/**
 * Structured logging function with request context
 */
export function structuredLog(level: LogLevel, context: LogData, message: string, ...optionalParams: any[]) {
  log(level, message, context, ...optionalParams);
}

/**
 * Log with emoji prefix for better visual identification
 */
export function emojiLog(emoji: string, message: any, ...optionalParams: any[]) {
  // Always log emoji messages in production as well, but without emoji in production logs
  if (isDevelopment) {
    console.log(`[${getTimestamp()}] ${emoji} ${message}`, ...optionalParams);
  } else {
    // In production, still log but without emoji for cleaner logs
    info(`${message}`, ...optionalParams);
  }
}

// Export default object for easier importing
const logger = {
  debug,
  info,
  warn,
  error,
  emojiLog,
  structuredLog
};

export default logger;

// Export types for better TypeScript support
export type { LogData };