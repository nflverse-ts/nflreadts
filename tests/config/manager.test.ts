/**
 * Tests for configuration manager
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import { ConfigManager, configure, getConfig } from '../../src/config/manager.js';

describe('ConfigManager', () => {
  // Reset singleton before each test
  beforeEach(() => {
    ConfigManager.reset();
  });

  afterEach(() => {
    ConfigManager.reset();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = ConfigManager.getInstance();
      ConfigManager.reset();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Default configuration', () => {
    it('should use default config when no user config provided', () => {
      const manager = ConfigManager.getInstance();
      const config = manager.getConfig();

      expect(config.http.timeout).toBe(DEFAULT_CONFIG.http.timeout);
      expect(config.cache.enabled).toBe(DEFAULT_CONFIG.cache.enabled);
    });

    it('should apply environment defaults', () => {
      const manager = ConfigManager.getInstance();
      const config = manager.getConfig();

      // Should have applied environment-specific defaults
      expect(config).toBeDefined();
      expect(config.cache.storage).toBeDefined();
    });
  });

  describe('User configuration', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        http: {
          timeout: 60000,
        },
      };

      const manager = ConfigManager.getInstance(userConfig);
      const config = manager.getConfig();

      expect(config.http.timeout).toBe(60000);
      expect(config.http.retries).toBe(DEFAULT_CONFIG.http.retries);
    });

    it('should deep merge nested config', () => {
      const userConfig = {
        http: {
          timeout: 60000,
          headers: {
            'X-Custom': 'value',
          },
        },
      };

      const manager = ConfigManager.getInstance(userConfig);
      const config = manager.getConfig();

      expect(config.http.timeout).toBe(60000);
      expect(config.http.retries).toBe(DEFAULT_CONFIG.http.retries);
      expect(config.http.headers).toEqual({ 'X-Custom': 'value' });
    });

    it('should allow updating config after initialization', () => {
      const manager = ConfigManager.getInstance();

      expect(manager.getConfig().http.timeout).toBe(DEFAULT_CONFIG.http.timeout);

      manager.update({
        http: {
          timeout: 90000,
        },
      });

      expect(manager.getConfig().http.timeout).toBe(90000);
    });
  });

  describe('Get methods', () => {
    it('should get entire section', () => {
      const manager = ConfigManager.getInstance();
      const httpConfig = manager.get('http');

      expect(httpConfig).toBeDefined();
      expect(httpConfig.timeout).toBeDefined();
      expect(httpConfig.retries).toBeDefined();
    });

    it('should get specific key from section', () => {
      const manager = ConfigManager.getInstance();
      const timeout = manager.get('http', 'timeout');

      expect(timeout).toBe(DEFAULT_CONFIG.http.timeout);
    });

    it('should return readonly config', () => {
      const manager = ConfigManager.getInstance();
      const config = manager.getConfig();

      // TypeScript should prevent this, but at runtime it should not affect the actual config
      expect(() => {
        config.http.timeout = 99999;
      }).not.toThrow();

      // Original config should not be affected through the getter
      const newConfig = manager.getConfig();
      expect(newConfig.http.timeout).toBe(DEFAULT_CONFIG.http.timeout);
    });
  });

  describe('Reset functionality', () => {
    it('should reset to defaults', () => {
      const manager = ConfigManager.getInstance({
        http: {
          timeout: 90000,
        },
      });

      expect(manager.getConfig().http.timeout).toBe(90000);

      manager.resetToDefaults();

      // Should be back to default (with environment overrides)
      const config = manager.getConfig();
      expect(config.http.timeout).toBe(DEFAULT_CONFIG.http.timeout);
    });
  });

  describe('Convenience functions', () => {
    it('should configure using convenience function', () => {
      configure({
        http: {
          timeout: 75000,
        },
      });

      const config = getConfig();
      expect(config.http.timeout).toBe(75000);
    });

    it('should get config using convenience function', () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.http).toBeDefined();
    });
  });
});
