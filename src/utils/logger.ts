/**
 * Logging utilities
 * @module utils/logger
 */

import { getConfig } from '../config/manager.js';

import type { LogConfig } from '../config/types.js';
import { LogLevel } from '../types/enums.js';
import { LogLevelMap } from '../types/utils.js';

/**
 * Logger class for structured logging with configurable levels
 * Supports custom log functions and log level filtering
 *
 * @example
 * ```typescript
 * const logger = new Logger();
 * logger.info('Application started');
 * logger.error('An error occurred', { errorCode: 500 });
 * ```
 */
export class Logger {
  private config: LogConfig;

  /**
   * Create a new Logger instance
   *
   * @param config - Optional log configuration (defaults to global config)
   */
  constructor(config?: LogConfig) {
    this.config = config ?? getConfig().logging;
  }

  /**
   * Get the current log level as a number
   * @private
   * @returns Numeric log level
   */
  private getLogLevel(): LogLevel {
    return LogLevelMap[this.config.level] ?? LogLevel.WARN;
  }

  /**
   * Check if a log level should be logged
   * @private
   * @param level - Log level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.getLogLevel();
  }

  /**
   * Log a message at a specific level
   * @private
   * @param level - Numeric log level
   * @param levelName - String name of the level
   * @param message - Log message
   * @param args - Additional arguments to log
   */
  private log(level: LogLevel, levelName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Use custom logger if provided
    if (this.config.logger) {
      this.config.logger(levelName, message, ...args);
      return;
    }
  }

  /**
   * Log an error message
   *
   * @param message - Error message to log
   * @param args - Additional context or data to log
   *
   * @example
   * ```typescript
   * logger.error('Failed to fetch data', { url: '/api/data', status: 500 });
   * ```
   */
  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, 'error', message, ...args);
  }

  /**
   * Log a warning message
   *
   * @param message - Warning message to log
   * @param args - Additional context or data to log
   *
   * @example
   * ```typescript
   * logger.warn('Deprecation notice', { feature: 'oldAPI', replacement: 'newAPI' });
   * ```
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, 'warn', message, ...args);
  }

  /**
   * Log an info message
   *
   * @param message - Info message to log
   * @param args - Additional context or data to log
   *
   * @example
   * ```typescript
   * logger.info('Data loaded successfully', { recordCount: 100 });
   * ```
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'info', message, ...args);
  }

  /**
   * Log a debug message
   * Only logged if debug mode is enabled in config
   *
   * @param message - Debug message to log
   * @param args - Additional context or data to log
   *
   * @example
   * ```typescript
   * logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });
   * ```
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      this.log(LogLevel.DEBUG, 'debug', message, ...args);
    }
  }

  /**
   * Log an error object with stack trace
   *
   * @param error - Error object to log
   * @param context - Additional context to include
   *
   * @example
   * ```typescript
   * try {
   *   // some operation
   * } catch (error) {
   *   logger.logError(error as Error, { operation: 'fetchData' });
   * }
   * ```
   */
  logError(error: Error, context?: Record<string, unknown>): void {
    this.error('Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Create a child logger with additional context
   * The context will be prepended to all log messages
   *
   * @param context - Context to add to all child logger messages
   * @returns New Logger instance with added context
   *
   * @example
   * ```typescript
   * const requestLogger = logger.child({ requestId: '123', userId: 'user456' });
   * requestLogger.info('Processing request');
   * // Logs: "[requestId=123 userId=user456] Processing request"
   * ```
   */
  child(context: Record<string, unknown>): Logger {
    const originalLogger = this.config.logger;

    const childLogger: LogConfig['logger'] = (level, message, ...args) => {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(' ');

      if (originalLogger) {
        originalLogger(level, `[${contextStr}] ${message}`, ...args);
      } else {
        // Will be handled by default console logging in log()
        this.log(LogLevelMap[level] ?? LogLevel.INFO, level, `[${contextStr}] ${message}`, ...args);
      }
    };

    return new Logger({
      ...this.config,
      logger: childLogger,
    });
  }

  /**
   * Update logger configuration
   * Merges new config with existing configuration
   *
   * @param config - Partial configuration to update
   *
   * @example
   * ```typescript
   * logger.updateConfig({ level: 'debug', debug: true });
   * ```
   */
  updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default logger instance (singleton)
 * @private
 */
let defaultLogger: Logger | null = null;

/**
 * Get the default logger instance
 * Uses singleton pattern for consistent logging across the application
 *
 * @returns The default Logger instance
 *
 * @example
 * ```typescript
 * const logger = getLogger();
 * logger.info('Application started');
 * ```
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger();
  }
  return defaultLogger;
}

/**
 * Reset the default logger (useful for testing)
 * Clears the singleton instance, allowing a new one to be created
 *
 * @example
 * ```typescript
 * // In test teardown
 * resetLogger();
 * ```
 */
export function resetLogger(): void {
  defaultLogger = null;
}

/**
 * Create a named logger with context
 * Convenience function that creates a child logger with a component name
 *
 * @param name - Component or module name
 * @returns Logger instance with component context
 *
 * @example
 * ```typescript
 * const dataLoader = createLogger('DataLoader');
 * dataLoader.info('Loading data');
 * // Logs: "[component=DataLoader] Loading data"
 * ```
 */
export function createLogger(name: string): Logger {
  return getLogger().child({ component: name });
}
