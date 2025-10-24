/**
 * Tests for logger utilities
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as configManager from '../../src/config/manager.js';
import { createLogger, getLogger, Logger, LogLevel, resetLogger } from '../../src/utils/logger.js';

import type { NflReadConfig } from '../../src/config/types.js';

// Shared mock config used across tests
const createMockConfig = (
  customLogger?: (level: string, message: string, ...args: unknown[]) => void
): NflReadConfig => ({
  dataSources: {
    baseUrl: 'http://test.com',
    mirrors: [],
  },
  logging: {
    level: 'info',
    debug: false,
    logger: customLogger,
  },
  cache: {
    enabled: true,
    maxSize: 100,
    ttl: 300000,
    storage: 'memory',
  },
  http: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    userAgent: 'nflreadts/test',
    headers: {},
  },
});

describe('Logger Utilities', () => {
  beforeEach(() => {
    resetLogger();
    vi.clearAllMocks();
  });

  describe('LogLevel enum', () => {
    it('should define log levels in order', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
    });
  });

  describe('Logger class', () => {
    describe('constructor', () => {
      it('should use provided config', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'debug',
          debug: true,
          logger: customLogger,
        });

        logger.debug('test');
        expect(customLogger).toHaveBeenCalledWith('debug', 'test');
      });

      it('should fall back to global config when not provided', () => {
        vi.spyOn(configManager, 'getConfig').mockReturnValue(createMockConfig());

        const logger = new Logger();
        expect(logger).toBeInstanceOf(Logger);
      });
    });

    describe('log level filtering', () => {
      it('should log error messages at error level', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'error',
          debug: false,
          logger: customLogger,
        });

        logger.error('error message');
        logger.warn('warn message');
        logger.info('info message');
        logger.debug('debug message');

        expect(customLogger).toHaveBeenCalledTimes(1);
        expect(customLogger).toHaveBeenCalledWith('error', 'error message');
      });

      it('should log error and warn at warn level', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'warn',
          debug: false,
          logger: customLogger,
        });

        logger.error('error message');
        logger.warn('warn message');
        logger.info('info message');
        logger.debug('debug message');

        expect(customLogger).toHaveBeenCalledTimes(2);
        expect(customLogger).toHaveBeenCalledWith('error', 'error message');
        expect(customLogger).toHaveBeenCalledWith('warn', 'warn message');
      });

      it('should log error, warn, and info at info level', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: customLogger,
        });

        logger.error('error message');
        logger.warn('warn message');
        logger.info('info message');
        logger.debug('debug message');

        expect(customLogger).toHaveBeenCalledTimes(3);
        expect(customLogger).toHaveBeenCalledWith('error', 'error message');
        expect(customLogger).toHaveBeenCalledWith('warn', 'warn message');
        expect(customLogger).toHaveBeenCalledWith('info', 'info message');
      });

      it('should log all messages at debug level when debug is true', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'debug',
          debug: true,
          logger: customLogger,
        });

        logger.error('error message');
        logger.warn('warn message');
        logger.info('info message');
        logger.debug('debug message');

        expect(customLogger).toHaveBeenCalledTimes(4);
        expect(customLogger).toHaveBeenCalledWith('error', 'error message');
        expect(customLogger).toHaveBeenCalledWith('warn', 'warn message');
        expect(customLogger).toHaveBeenCalledWith('info', 'info message');
        expect(customLogger).toHaveBeenCalledWith('debug', 'debug message');
      });

      it('should not log debug messages when debug is false', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'debug',
          debug: false,
          logger: customLogger,
        });

        logger.debug('debug message');
        expect(customLogger).not.toHaveBeenCalled();
      });

      it('should default to warn level for unknown log level', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'unknown' as 'error' | 'warn' | 'info' | 'debug',
          debug: false,
          logger: customLogger,
        });

        logger.error('error message');
        logger.warn('warn message');
        logger.info('info message');

        // Should default to warn, so error and warn logged but not info
        expect(customLogger).toHaveBeenCalledTimes(2);
      });
    });

    describe('log methods with arguments', () => {
      it('should pass additional arguments to custom logger', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: customLogger,
        });

        const obj = { foo: 'bar' };
        logger.info('message', obj, 123);

        expect(customLogger).toHaveBeenCalledWith('info', 'message', obj, 123);
      });

      it('should handle error method with args', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'error',
          debug: false,
          logger: customLogger,
        });

        logger.error('error', { code: 500 });
        expect(customLogger).toHaveBeenCalledWith('error', 'error', { code: 500 });
      });

      it('should handle warn method with args', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'warn',
          debug: false,
          logger: customLogger,
        });

        logger.warn('warning', 'detail');
        expect(customLogger).toHaveBeenCalledWith('warn', 'warning', 'detail');
      });

      it('should handle debug method with args', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'debug',
          debug: true,
          logger: customLogger,
        });

        logger.debug('debug', 1, 2, 3);
        expect(customLogger).toHaveBeenCalledWith('debug', 'debug', 1, 2, 3);
      });
    });

    describe('logError', () => {
      it('should log error object with stack trace', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'error',
          debug: false,
          logger: customLogger,
        });

        const error = new Error('Test error');
        logger.logError(error);

        expect(customLogger).toHaveBeenCalledWith('error', 'Error occurred:', {
          name: 'Error',
          message: 'Test error',
          stack: error.stack,
        });
      });

      it('should log error with additional context', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'error',
          debug: false,
          logger: customLogger,
        });

        const error = new Error('Test error');
        const context = { userId: 123, action: 'fetch' };
        logger.logError(error, context);

        expect(customLogger).toHaveBeenCalledWith('error', 'Error occurred:', {
          name: 'Error',
          message: 'Test error',
          stack: error.stack,
          userId: 123,
          action: 'fetch',
        });
      });
    });

    describe('child logger', () => {
      it('should create child logger with context using original logger', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: customLogger,
        });

        const child = logger.child({ requestId: '123' });
        child.info('test message');

        expect(customLogger).toHaveBeenCalledWith('info', '[requestId=123] test message');
      });

      it('should create child logger with multiple context fields', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: customLogger,
        });

        const child = logger.child({ requestId: '123', userId: '456' });
        child.info('test message');

        expect(customLogger).toHaveBeenCalledWith('info', expect.stringContaining('requestId=123'));
        expect(customLogger).toHaveBeenCalledWith('info', expect.stringContaining('userId=456'));
      });

      it('should create child logger without original logger', () => {
        const logger = new Logger({
          level: 'info',
          debug: false,
        });

        const child = logger.child({ component: 'test' });
        // Should not throw, even without custom logger
        expect(() => child.info('test')).not.toThrow();
      });

      it('should pass additional args to child logger', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: customLogger,
        });

        const child = logger.child({ module: 'http' });
        child.warn('request failed', { status: 500 });

        expect(customLogger).toHaveBeenCalledWith('warn', '[module=http] request failed', {
          status: 500,
        });
      });

      it('should respect log level in child logger', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'warn',
          debug: false,
          logger: customLogger,
        });

        const child = logger.child({ module: 'test' });
        child.info('should not log'); // info is below warn level
        child.warn('should log');

        expect(customLogger).toHaveBeenCalledTimes(1);
        expect(customLogger).toHaveBeenCalledWith('warn', '[module=test] should log');
      });
    });

    describe('updateConfig', () => {
      it('should update logger configuration', () => {
        const logger1 = vi.fn();
        const logger2 = vi.fn();

        const logger = new Logger({
          level: 'info',
          debug: false,
          logger: logger1,
        });

        logger.info('before update');
        expect(logger1).toHaveBeenCalledWith('info', 'before update');

        logger.updateConfig({ logger: logger2 });
        logger.info('after update');
        expect(logger2).toHaveBeenCalledWith('info', 'after update');
      });

      it('should partially update config', () => {
        const customLogger = vi.fn();
        const logger = new Logger({
          level: 'error',
          debug: false,
          logger: customLogger,
        });

        logger.info('should not log at error level');
        expect(customLogger).not.toHaveBeenCalled();

        logger.updateConfig({ level: 'info' });
        logger.info('should log at info level');
        expect(customLogger).toHaveBeenCalledWith('info', 'should log at info level');
      });
    });

    describe('no custom logger fallback', () => {
      it('should handle logging without custom logger', () => {
        const logger = new Logger({
          level: 'info',
          debug: false,
        });

        // Should not throw even without custom logger
        expect(() => {
          logger.error('error');
          logger.warn('warn');
          logger.info('info');
        }).not.toThrow();
      });
    });
  });

  describe('getLogger', () => {
    it('should return singleton logger instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it('should create new instance after reset', () => {
      const logger1 = getLogger();
      resetLogger();
      const logger2 = getLogger();

      expect(logger1).not.toBe(logger2);
    });
  });

  describe('resetLogger', () => {
    it('should reset the default logger', () => {
      const logger1 = getLogger();
      resetLogger();

      // After reset, getting logger should create a new instance
      const logger2 = getLogger();
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('createLogger', () => {
    it('should create named logger with component context', () => {
      const customLogger = vi.fn();
      vi.spyOn(configManager, 'getConfig').mockReturnValue(createMockConfig(customLogger));

      resetLogger(); // Reset to pick up new config
      const logger = createLogger('HttpClient');
      logger.info('test');

      expect(customLogger).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('component=HttpClient')
      );
    });

    it('should create multiple named loggers', () => {
      const customLogger = vi.fn();
      vi.spyOn(configManager, 'getConfig').mockReturnValue(createMockConfig(customLogger));

      resetLogger();
      const logger1 = createLogger('Module1');
      const logger2 = createLogger('Module2');

      logger1.info('from module 1');
      logger2.info('from module 2');

      expect(customLogger).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('component=Module1')
      );
      expect(customLogger).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('component=Module2')
      );
    });
  });
});
