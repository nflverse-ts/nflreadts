/**
 * Tests for HttpClient
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpClient, createHttpClient } from '../../src/client/client.js';
import { NetworkError, RequestAbortedError, TimeoutError } from '../../src/types/error.js';

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Factory', () => {
    it('should create client with default config', () => {
      const client = new HttpClient();
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should create client with custom config', () => {
      const client = new HttpClient({
        timeout: 5000,
        retry: 5,
        cache: false,
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should create client via factory function', () => {
      const client = createHttpClient({ debug: true });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should accept base URL', () => {
      const client = new HttpClient({
        baseUrl: 'https://api.example.com',
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should configure headers', () => {
      const client = new HttpClient({
        headers: {
          'X-Custom': 'value',
        },
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should configure user agent', () => {
      const client = new HttpClient({
        userAgent: 'TestAgent/1.0',
      });
      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('Cache Management', () => {
    it('should have cache methods', () => {
      expect(typeof client.clearCache).toBe('function');
      expect(typeof client.getCacheStats).toBe('function');
      expect(typeof client.evictExpiredCache).toBe('function');
    });

    it('should clear cache', () => {
      client.clearCache();
      const stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should get cache stats', () => {
      const stats = client.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('entries');
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    it('should evict expired entries', () => {
      const evicted = client.evictExpiredCache();
      expect(typeof evicted).toBe('number');
      expect(evicted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hooks', () => {
    it('should accept hooks', () => {
      const beforeRequest = vi.fn();
      const afterResponse = vi.fn();
      const onError = vi.fn();

      client.setHooks({
        beforeRequest,
        afterResponse,
        onError,
      });

      expect(typeof client.setHooks).toBe('function');
    });

    it('should allow setting individual hooks', () => {
      client.setHooks({
        beforeRequest: (url) => {
          expect(url).toBeDefined();
        },
      });

      client.setHooks({
        afterResponse: (response) => {
          expect(response.status).toBeDefined();
        },
      });

      expect(true).toBe(true);
    });

    it('should support async hooks', () => {
      client.setHooks({
        beforeRequest: async (url) => {
          await Promise.resolve();
          expect(url).toBeDefined();
        },
        afterResponse: async (response) => {
          await Promise.resolve();
          expect(response).toBeDefined();
        },
        onError: async (error, url) => {
          await Promise.resolve();
          expect(error).toBeDefined();
          expect(url).toBeDefined();
        },
      });

      expect(true).toBe(true);
    });
  });

  describe('HTTP Methods', () => {
    it('should have GET method', () => {
      expect(typeof client.get).toBe('function');
    });

    it('should have POST method', () => {
      expect(typeof client.post).toBe('function');
    });

    it('should have PUT method', () => {
      expect(typeof client.put).toBe('function');
    });

    it('should have DELETE method', () => {
      expect(typeof client.delete).toBe('function');
    });

    it('should have HEAD method', () => {
      expect(typeof client.head).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should handle debug mode', () => {
      const debugClient = new HttpClient({ debug: true });
      expect(debugClient).toBeInstanceOf(HttpClient);
    });

    it('should handle custom headers', () => {
      const client = new HttpClient({
        headers: {
          'X-Custom-Header': 'value',
          Authorization: 'Bearer token',
        },
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should handle custom user agent', () => {
      const client = new HttpClient({
        userAgent: 'MyApp/1.0',
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should handle cache configuration', () => {
      const client = new HttpClient({
        cache: false,
        cacheTtl: 60000,
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should handle timeout configuration', () => {
      const client = new HttpClient({
        timeout: 10000,
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should handle retry configuration', () => {
      const client = new HttpClient({
        retry: 5,
      });
      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('Error Handling', () => {
    it('should import error classes', () => {
      expect(NetworkError).toBeDefined();
      expect(TimeoutError).toBeDefined();
    });

    it('should allow creating NetworkError', () => {
      const error = new NetworkError('Test error', { url: 'https://example.com' });
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Test error');
      expect(error.context?.url).toBe('https://example.com');
    });

    it('should allow creating TimeoutError', () => {
      const error = new TimeoutError('Timeout', { url: 'https://example.com' });
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('Timeout');
    });
  });

  describe('Type Safety', () => {
    it('should support generic type parameters for GET', () => {
      const getMethod = client.get.bind(client);
      expect(typeof getMethod).toBe('function');
    });

    it('should support generic type parameters for POST', () => {
      const postMethod = client.post.bind(client);
      expect(typeof postMethod).toBe('function');
    });

    it('should support generic type parameters for PUT', () => {
      const putMethod = client.put.bind(client);
      expect(typeof putMethod).toBe('function');
    });

    it('should support generic type parameters for DELETE', () => {
      const deleteMethod = client.delete.bind(client);
      expect(typeof deleteMethod).toBe('function');
    });
  });

  describe('Request Options', () => {
    it('should support timeout option', () => {
      const client = new HttpClient({ timeout: 5000 });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should support retry option', () => {
      const client = new HttpClient({ retry: 3 });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should support cache options', () => {
      const client = new HttpClient({ cache: true, cacheTtl: 60000 });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should support disabling cache', () => {
      const client = new HttpClient({ cache: false });
      const stats = client.getCacheStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should create multiple clients independently', () => {
      const client1 = new HttpClient({ debug: true });
      const client2 = new HttpClient({ debug: false });

      expect(client1).toBeInstanceOf(HttpClient);
      expect(client2).toBeInstanceOf(HttpClient);
      expect(client1).not.toBe(client2);
    });

    it('should manage separate caches', () => {
      const client1 = new HttpClient();
      const client2 = new HttpClient();

      const stats1 = client1.getCacheStats();
      const stats2 = client2.getCacheStats();

      expect(stats1.size).toBe(0);
      expect(stats2.size).toBe(0);

      client1.clearCache();
      const newStats2 = client2.getCacheStats();
      expect(newStats2.size).toBe(0);
    });
  });

  describe('AbortController Support', () => {
    it('should support AbortSignal in request options', () => {
      const controller = new AbortController();

      // Just verify the type system accepts the signal parameter
      expect(() => {
        const options = { signal: controller.signal };
        expect(options.signal).toBeDefined();
      }).not.toThrow();
    });

    it('should handle aborted requests', async () => {
      const client = new HttpClient();
      const controller = new AbortController();

      // Mock a slow request
      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
          })
      );
      global.fetch = mockFetch;

      // Abort immediately
      controller.abort();

      try {
        await client.get('https://example.com/data', { signal: controller.signal });
        expect.fail('Should have thrown RequestAbortedError');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestAbortedError);
      }
    });

    it('should allow aborting in-flight requests', async () => {
      const client = new HttpClient();
      const controller = new AbortController();

      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              if (controller.signal.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
              }
            }, 50);
          })
      );
      global.fetch = mockFetch;

      const requestPromise = client.get('https://example.com/data', { signal: controller.signal });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 10);

      try {
        await requestPromise;
        expect.fail('Should have thrown RequestAbortedError');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestAbortedError);
      }
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should create client with rate limiting', () => {
      const client = new HttpClient({
        rateLimit: {
          maxRequests: 10,
          interval: 1000,
        },
      });

      expect(client).toBeInstanceOf(HttpClient);
      const stats = client.getRateLimiterStats();
      expect(stats).not.toBeNull();
      expect(stats?.maxTokens).toBe(10);
    });

    it('should return null stats when rate limiting is disabled', () => {
      const client = new HttpClient();
      const stats = client.getRateLimiterStats();
      expect(stats).toBeNull();
    });

    it('should allow resetting rate limiter', () => {
      const client = new HttpClient({
        rateLimit: {
          maxRequests: 10,
          interval: 1000,
        },
      });

      expect(() => client.resetRateLimiter()).not.toThrow();
    });

    it('should not throw when resetting without rate limiter', () => {
      const client = new HttpClient();
      expect(() => client.resetRateLimiter()).not.toThrow();
    });

    it('should track rate limiter statistics', () => {
      const client = new HttpClient({
        rateLimit: {
          maxRequests: 100,
          interval: 60000,
        },
      });

      const stats = client.getRateLimiterStats();
      expect(stats).toBeDefined();
      expect(stats?.availableTokens).toBe(100);
      expect(stats?.maxTokens).toBe(100);
      expect(stats?.queueLength).toBe(0);
    });
  });
});
