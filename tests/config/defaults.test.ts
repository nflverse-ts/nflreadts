/**
 * Tests for default configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  DEFAULT_CONFIG,
  detectEnvironment,
  getEnvironmentDefaults,
} from '../../src/config/defaults.js';

describe('Default Configuration', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have all required sections', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('http');
      expect(DEFAULT_CONFIG).toHaveProperty('cache');
      expect(DEFAULT_CONFIG).toHaveProperty('dataSources');
      expect(DEFAULT_CONFIG).toHaveProperty('logging');
    });

    it('should have valid HTTP defaults', () => {
      expect(DEFAULT_CONFIG.http.timeout).toBe(30000);
      expect(DEFAULT_CONFIG.http.retries).toBe(3);
      expect(DEFAULT_CONFIG.http.retryDelay).toBe(1000);
      expect(DEFAULT_CONFIG.http.userAgent).toContain('nflreadts/');
      expect(DEFAULT_CONFIG.http.headers).toEqual({});
    });

    it('should have valid cache defaults', () => {
      expect(DEFAULT_CONFIG.cache.enabled).toBe(true);
      expect(DEFAULT_CONFIG.cache.ttl).toBe(3600000);
      expect(DEFAULT_CONFIG.cache.maxSize).toBe(100);
      expect(DEFAULT_CONFIG.cache.storage).toBe('memory');
    });

    it('should have valid data source defaults', () => {
      expect(DEFAULT_CONFIG.dataSources.baseUrl).toContain('github.com');
      expect(DEFAULT_CONFIG.dataSources.mirrors).toEqual([]);
    });

    it('should have valid logging defaults', () => {
      expect(DEFAULT_CONFIG.logging.debug).toBe(false);
      expect(DEFAULT_CONFIG.logging.level).toBe('warn');
    });
  });

  describe('detectEnvironment', () => {
    let originalProcess: typeof global.process;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let originalWindow: any;

    beforeEach(() => {
      originalProcess = global.process;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      originalWindow = (global as any).window;
    });

    afterEach(() => {
      global.process = originalProcess;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (global as any).window = originalWindow;
    });

    it('should detect Node.js environment', () => {
      // In vitest, we're in Node.js
      const env = detectEnvironment();
      expect(env).toBe('node');
    });

    it('should detect browser environment', () => {
      // Mock browser environment
      vi.stubGlobal('process', undefined);
      vi.stubGlobal('window', {});
      vi.stubGlobal('document', {});

      const env = detectEnvironment();
      expect(env).toBe('browser');

      vi.unstubAllGlobals();
    });

    it('should detect unknown environment', () => {
      vi.stubGlobal('process', undefined);
      vi.stubGlobal('window', undefined);

      const env = detectEnvironment();
      expect(env).toBe('unknown');

      vi.unstubAllGlobals();
    });
  });

  describe('getEnvironmentDefaults', () => {
    it('should return node-specific defaults', () => {
      const defaults = getEnvironmentDefaults('node');
      expect(defaults).toBeDefined();
      // Node currently has no specific overrides
      expect(defaults).toEqual({});
    });

    it('should return browser-specific defaults', () => {
      const defaults = getEnvironmentDefaults('browser');
      expect(defaults).toBeDefined();
      expect(defaults.cache?.maxSize).toBe(50);
    });

    it('should return empty defaults for unknown environment', () => {
      const defaults = getEnvironmentDefaults('unknown');
      expect(defaults).toEqual({});
    });
  });
});
