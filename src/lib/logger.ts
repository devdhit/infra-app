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

/**
 * Main logging function that respects environment settings
 * @param level Log level
 * @param message Log message
 * @param optionalParams Additional parameters to log
 */
function log(level: LogLevel, message: any, ...optionalParams: any[]) {
  // In production, only log info, warnings, and errors (not debug)
  if (!isDevelopment && level === 'debug') {
    return;
  }

  // Format the message with timestamp and log level
  const formattedMessage = `[${getTimestamp()}] ${level.toUpperCase()}: ${message}`;
  
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
 * Log with emoji prefix for better visual identification
 */
export function emojiLog(emoji: string, message: any, ...optionalParams: any[]) {
  if (isDevelopment) {
    console.log(`[${getTimestamp()}] ${emoji} ${message}`, ...optionalParams);
  } else {
    // In production, still log but without emoji
    info(`${emoji} ${message}`, ...optionalParams);
  }
}

// Export default object for easier importing
const logger = {
  debug,
  info,
  warn,
  error,
  emojiLog
};

export default logger;