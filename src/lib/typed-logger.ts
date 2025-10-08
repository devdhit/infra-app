// Typed logger utility that extends the existing logger
import logger from './logger';

// Define log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Define log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  component?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Logger interface
export interface Logger {
  error(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

// Create a typed logger instance
class TypedLogger implements Logger {
  private logger: any;

  constructor() {
    this.logger = logger;
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.logger.error(message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }

  // Log with specific component context
  log(level: LogLevel, message: string, component?: string, metadata?: Record<string, any>): void {
    switch (level) {
      case 'error':
        this.logger.error(message, { component, ...metadata });
        break;
      case 'warn':
        this.logger.warn(message, { component, ...metadata });
        break;
      case 'info':
        this.logger.info(message, { component, ...metadata });
        break;
      case 'debug':
        this.logger.debug(message, { component, ...metadata });
        break;
      default:
        this.logger.info(message, { component, ...metadata });
    }
  }
}

// Export singleton instance
const typedLogger = new TypedLogger();
export default typedLogger;