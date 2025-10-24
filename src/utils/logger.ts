/**
 * Logging utilities
 * @module utils/logger
 */

import { getConfig } from '../config/manager.js';

import type { LogConfig } from '../config/types.js';

/**
 * Log level enum
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Map log level string to number
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

/**
 * Logger class
 */
export class Logger {
  private config: LogConfig;

  constructor(config?: LogConfig) {
    this.config = config ?? getConfig().logging;
  }

  /**
   * Get the current log level as a number
   */
  private getLogLevel(): LogLevel {
    return LOG_LEVEL_MAP[this.config.level] ?? LogLevel.WARN;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.getLogLevel();
  }

  /**
   * Format log message
   */
  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
      const argsStr = args
        .map((arg) => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');
      return `${prefix} ${message} ${argsStr}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Log a message
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

    // Default console logging
    const formattedMessage = this.formatMessage(levelName, message, ...args);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, 'error', message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, 'warn', message, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'info', message, ...args);
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      this.log(LogLevel.DEBUG, 'debug', message, ...args);
    }
  }

  /**
   * Log an error object
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
        this.log(
          LOG_LEVEL_MAP[level] ?? LogLevel.INFO,
          level,
          `[${contextStr}] ${message}`,
          ...args
        );
      }
    };

    return new Logger({
      ...this.config,
      logger: childLogger,
    });
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default logger instance
 */
let defaultLogger: Logger | null = null;

/**
 * Get the default logger instance
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger();
  }
  return defaultLogger;
}

/**
 * Reset the default logger (useful for testing)
 */
export function resetLogger(): void {
  defaultLogger = null;
}

/**
 * Create a named logger with context
 */
export function createLogger(name: string): Logger {
  return getLogger().child({ component: name });
}
