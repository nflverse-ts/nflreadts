/**
 * Tests for environment variable configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { loadConfigFromEnv } from '../../src/config/env.js';

describe('Environment Variable Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return empty config when no env vars set', () => {
    const config = loadConfigFromEnv();
    expect(config).toEqual({});
  });

  describe('HTTP configuration', () => {
    it('should load HTTP timeout from env', () => {
      process.env.NFLREADTS_HTTP_TIMEOUT = '60000';
      const config = loadConfigFromEnv();

      expect(config.http?.timeout).toBe(60000);
    });

    it('should load HTTP retries from env', () => {
      process.env.NFLREADTS_HTTP_RETRIES = '5';
      const config = loadConfigFromEnv();

      expect(config.http?.retries).toBe(5);
    });

    it('should load HTTP retry delay from env', () => {
      process.env.NFLREADTS_HTTP_RETRY_DELAY = '2000';
      const config = loadConfigFromEnv();

      expect(config.http?.retryDelay).toBe(2000);
    });

    it('should load HTTP user agent from env', () => {
      process.env.NFLREADTS_HTTP_USER_AGENT = 'custom-agent';
      const config = loadConfigFromEnv();

      expect(config.http?.userAgent).toBe('custom-agent');
    });

    it('should load multiple HTTP settings', () => {
      process.env.NFLREADTS_HTTP_TIMEOUT = '45000';
      process.env.NFLREADTS_HTTP_RETRIES = '2';
      const config = loadConfigFromEnv();

      expect(config.http?.timeout).toBe(45000);
      expect(config.http?.retries).toBe(2);
    });
  });

  describe('Cache configuration', () => {
    it('should load cache enabled from env (true)', () => {
      process.env.NFLREADTS_CACHE_ENABLED = 'true';
      const config = loadConfigFromEnv();

      expect(config.cache?.enabled).toBe(true);
    });

    it('should load cache enabled from env (false)', () => {
      process.env.NFLREADTS_CACHE_ENABLED = 'false';
      const config = loadConfigFromEnv();

      expect(config.cache?.enabled).toBe(false);
    });

    it('should load cache enabled from env (1/0)', () => {
      process.env.NFLREADTS_CACHE_ENABLED = '1';
      let config = loadConfigFromEnv();
      expect(config.cache?.enabled).toBe(true);

      process.env.NFLREADTS_CACHE_ENABLED = '0';
      config = loadConfigFromEnv();
      expect(config.cache?.enabled).toBe(false);
    });

    it('should load cache TTL from env', () => {
      process.env.NFLREADTS_CACHE_TTL = '7200000';
      const config = loadConfigFromEnv();

      expect(config.cache?.ttl).toBe(7200000);
    });

    it('should load cache max size from env', () => {
      process.env.NFLREADTS_CACHE_MAX_SIZE = '200';
      const config = loadConfigFromEnv();

      expect(config.cache?.maxSize).toBe(200);
    });
  });

  describe('Data source configuration', () => {
    it('should load base URL from env', () => {
      process.env.NFLREADTS_DATA_SOURCE_BASE_URL = 'https://custom.example.com';
      const config = loadConfigFromEnv();

      expect(config.dataSources?.baseUrl).toBe('https://custom.example.com');
    });
  });

  describe('Logging configuration', () => {
    it('should load debug flag from env', () => {
      process.env.NFLREADTS_LOGGING_DEBUG = 'true';
      const config = loadConfigFromEnv();

      expect(config.logging?.debug).toBe(true);
    });

    it('should load log level from env', () => {
      process.env.NFLREADTS_LOGGING_LEVEL = 'debug';
      const config = loadConfigFromEnv();

      expect(config.logging?.level).toBe('debug');
    });

    it('should validate log level', () => {
      process.env.NFLREADTS_LOGGING_LEVEL = 'invalid';
      const config = loadConfigFromEnv();

      expect(config.logging?.level).toBeUndefined();
    });

    it('should accept all valid log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'] as const;

      for (const level of levels) {
        process.env.NFLREADTS_LOGGING_LEVEL = level;
        const config = loadConfigFromEnv();
        expect(config.logging?.level).toBe(level);
      }
    });
  });

  describe('Invalid values', () => {
    it('should ignore invalid numbers', () => {
      process.env.NFLREADTS_HTTP_TIMEOUT = 'not-a-number';
      const config = loadConfigFromEnv();

      expect(config.http?.timeout).toBeUndefined();
    });

    it('should ignore invalid booleans', () => {
      process.env.NFLREADTS_CACHE_ENABLED = 'maybe';
      const config = loadConfigFromEnv();

      expect(config.cache?.enabled).toBeUndefined();
    });
  });

  describe('Mixed configuration', () => {
    it('should load all sections together', () => {
      process.env.NFLREADTS_HTTP_TIMEOUT = '60000';
      process.env.NFLREADTS_CACHE_ENABLED = 'false';
      process.env.NFLREADTS_LOGGING_DEBUG = 'true';
      process.env.NFLREADTS_DATA_SOURCE_BASE_URL = 'https://test.com';

      const config = loadConfigFromEnv();

      expect(config.http?.timeout).toBe(60000);
      expect(config.cache?.enabled).toBe(false);
      expect(config.logging?.debug).toBe(true);
      expect(config.dataSources?.baseUrl).toBe('https://test.com');
    });
  });
});
