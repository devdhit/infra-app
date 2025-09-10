/**
 * Environment-aware logging utility for scripts
 * Only logs in development environment unless it's an error
 */

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log with emoji prefix for better visual identification
 */
function emojiLog(emoji, message, ...optionalParams) {
  if (isDevelopment) {
    console.log(`${emoji} ${message}`, ...optionalParams);
  }
}

/**
 * Log debug messages (only in development)
 */
function debug(message, ...optionalParams) {
  if (isDevelopment) {
    console.log(`DEBUG: ${message}`, ...optionalParams);
  }
}

/**
 * Log info messages (only in development)
 */
function info(message, ...optionalParams) {
  if (isDevelopment) {
    console.log(`INFO: ${message}`, ...optionalParams);
  }
}

/**
 * Log warning messages (in both development and production)
 */
function warn(message, ...optionalParams) {
  console.warn(`WARN: ${message}`, ...optionalParams);
}

/**
 * Log error messages (in both development and production)
 */
function error(message, ...optionalParams) {
  console.error(`ERROR: ${message}`, ...optionalParams);
}

module.exports = {
  emojiLog,
  debug,
  info,
  warn,
  error
};