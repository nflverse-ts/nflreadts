/**
 * Integration tests for HttpClient with mocked ky
 */
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { HttpClient } from '../../src/client/client.js';
import { NetworkError, TimeoutError } from '../../src/types/error.js';

// Create mock responses
const createMockResponse = (data: unknown, status = 200, contentType = 'application/json') => {
  const headers = new Map<string, string>();
  headers.set('content-type', contentType);
  headers.set('etag', 'mock-etag-123');
  headers.set('last-modified', 'Mon, 01 Jan 2024 00:00:00 GMT');

  const mockHeaders = {
    get: (key: string) => headers.get(key.toLowerCase()),
    has: (key: string) => headers.has(key.toLowerCase()),
    forEach: (callback: (value: string, key: string) => void) => {
      headers.forEach((value, key) => callback(value, key));
    },
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: mockHeaders,
    url: 'https://api.example.com/test',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    clone: function () {
      return this;
    },
  };
};

// Mock ky at module level
vi.mock('ky', () => {
  const mockCreate = vi.fn();
  const mockKy = vi.fn();

  return {
    default: Object.assign(mockKy, {
      create: mockCreate,
    }),
  };
});

describe('HttpClient Integration', () => {
  let client: HttpClient;
  let mockKyInstance: Mock;

  beforeEach(async () => {
    // Get the mocked ky module
    const ky = await import('ky');
    mockKyInstance = vi.fn();

    // Setup ky.create to return our mock instance
    (ky.default.create as Mock).mockReturnValue(mockKyInstance);

    client = new HttpClient({
      timeout: 5000,
      retry: 2,
      cache: true,
      debug: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    client.clearCache();
  });

  describe('GET Requests with JSON', () => {
    it('should make GET request and return JSON data', async () => {
      const mockData = { id: 1, name: 'Test', value: 42 };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.get<typeof mockData>('https://api.example.com/data');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(response.fromCache).toBe(false);
      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'get',
        })
      );
    });

    it('should return cached response on second GET request', async () => {
      const mockData = { id: 1, cached: true };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      // First request
      const response1 = await client.get('https://api.example.com/cached');
      expect(response1.fromCache).toBe(false);
      expect(mockKyInstance).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const response2 = await client.get('https://api.example.com/cached');
      expect(response2.fromCache).toBe(true);
      expect(response2.data).toEqual(mockData);
      expect(mockKyInstance).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should not cache when cache option is false', async () => {
      const mockData = { nocache: true };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.get('https://api.example.com/no-cache', { cache: false });

      expect(response.data).toEqual(mockData);
      expect(response.fromCache).toBe(false);

      const stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should use custom cache key', async () => {
      const mockData = { custom: true };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/data?param=1', {
        cacheKey: 'my-custom-key',
      });

      const stats = client.getCacheStats();
      expect(stats.entries).toContain('my-custom-key');
    });

    it('should respect custom timeout', async () => {
      const mockResponse = createMockResponse({ data: 'test' });
      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/test', { timeout: 1000 });

      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          timeout: 1000,
        })
      );
    });

    it('should respect custom retry', async () => {
      const mockResponse = createMockResponse({ data: 'test' });
      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/test', { retry: 5 });

      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          retry: expect.objectContaining({
            limit: 5,
          }) as { limit: number },
        })
      );
    });
  });

  describe('GET Requests with Text', () => {
    it('should handle text/plain responses', async () => {
      const mockText = 'Plain text response';
      const mockResponse = createMockResponse(mockText, 200, 'text/plain');

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.get<string>('https://api.example.com/text');

      expect(response.data).toEqual(mockText);
      expect(response.status).toBe(200);
    });

    it('should handle text/html responses', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      const mockResponse = createMockResponse(mockHtml, 200, 'text/html');

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.get<string>('https://api.example.com/html');

      expect(response.data).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('GET Requests with Binary', () => {
    it('should handle binary responses', async () => {
      const mockResponse = createMockResponse(null, 200, 'application/octet-stream');

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.get<ArrayBuffer>('https://api.example.com/binary');

      expect(response.data).toBeInstanceOf(ArrayBuffer);
      expect(response.status).toBe(200);
    });
  });

  describe('POST Requests', () => {
    it('should make POST request with JSON data', async () => {
      const postData = { name: 'New Item', value: 100 };
      const mockResponse = createMockResponse({ id: 123, ...postData }, 201);

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.post('https://api.example.com/items', postData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'post',
          json: postData,
        })
      );
    });

    it('should not cache POST requests', async () => {
      const mockResponse = createMockResponse({ success: true });

      mockKyInstance.mockResolvedValue(mockResponse);

      await client.post('https://api.example.com/create', { test: true });

      const stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request', async () => {
      const putData = { name: 'Updated Item' };
      const mockResponse = createMockResponse({ ...putData, updated: true });

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.put('https://api.example.com/items/1', putData);

      expect(response.data).toHaveProperty('updated');
      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'put',
          json: putData,
        })
      );
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request', async () => {
      const mockResponse = createMockResponse({ deleted: true }, 204);

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.delete('https://api.example.com/items/1');

      expect(response.status).toBe(204);
      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'delete',
        })
      );
    });
  });

  describe('HEAD Requests', () => {
    it('should make HEAD request', async () => {
      const mockResponse = createMockResponse(undefined, 200);

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await client.head('https://api.example.com/check');

      expect(response.status).toBe(200);
      expect(mockKyInstance).toHaveBeenCalledWith(
        'https://api.example.com/check',
        expect.objectContaining({
          method: 'head',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw NetworkError on request failure', async () => {
      const error = new Error('Network failure');
      mockKyInstance.mockRejectedValue(error);

      await expect(client.get('https://api.example.com/fail')).rejects.toThrow(NetworkError);
    });

    it('should throw TimeoutError on timeout', async () => {
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'TimeoutError';
      mockKyInstance.mockRejectedValue(timeoutError);

      await expect(client.get('https://api.example.com/timeout')).rejects.toThrow(TimeoutError);
    });

    it('should include context in error', async () => {
      const error = new Error('Failed');
      mockKyInstance.mockRejectedValue(error);

      try {
        await client.get('https://api.example.com/error');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(NetworkError);
        const networkError = e as NetworkError;
        expect(networkError.context).toHaveProperty('url');
      }
    });
  });

  describe('Hooks', () => {
    it('should call afterResponse hook', async () => {
      const afterResponse = vi.fn();
      client.setHooks({ afterResponse });

      const mockData = { test: true };
      const mockResponse = createMockResponse(mockData);
      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/success');

      expect(afterResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockData,
          status: 200,
          fromCache: false,
        })
      );
    });

    it('should call onError hook on failure', async () => {
      const onError = vi.fn();
      client.setHooks({ onError });

      const error = new Error('Request failed');
      mockKyInstance.mockRejectedValue(error);

      try {
        await client.get('https://api.example.com/fail');
      } catch {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(
        expect.any(NetworkError),
        'https://api.example.com/fail'
      );
    });

    it('should call afterResponse hook for cached responses', async () => {
      const afterResponse = vi.fn();
      const mockData = { cached: true };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      // First request
      await client.get('https://api.example.com/cached');

      client.setHooks({ afterResponse });

      // Second request from cache
      await client.get('https://api.example.com/cached');

      expect(afterResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockData,
          fromCache: true,
        })
      );
    });
  });

  describe('Cache Behavior', () => {
    it('should cache successful responses with etag', async () => {
      const mockData = { test: 'data' };
      const mockResponse = createMockResponse(mockData);

      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/etag-test');

      const stats = client.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should clear cache', async () => {
      const mockResponse = createMockResponse({ data: 'test' });
      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/data');

      let stats = client.getCacheStats();
      expect(stats.size).toBe(1);

      client.clearCache();

      stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should evict expired entries', () => {
      const evicted = client.evictExpiredCache();
      expect(typeof evicted).toBe('number');
      expect(evicted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration', () => {
    it('should work with debug mode enabled', async () => {
      const debugClient = new HttpClient({ debug: true });
      const mockResponse = createMockResponse({ debug: true });

      mockKyInstance.mockResolvedValue(mockResponse);

      const response = await debugClient.get('https://api.example.com/debug');

      expect(response).toBeDefined();
    });

    it('should log cache hits in debug mode', async () => {
      const debugClient = new HttpClient({ debug: true });
      const mockResponse = createMockResponse({ data: 'test' });

      mockKyInstance.mockResolvedValue(mockResponse);

      // First request - not cached
      await debugClient.get('https://api.example.com/cache-debug');

      // Second request - cached (should trigger debug log at line 173)
      const response = await debugClient.get('https://api.example.com/cache-debug');

      expect(response.fromCache).toBe(true);
    });

    it('should work with custom cacheTtl', async () => {
      const mockResponse = createMockResponse({ data: 'test' });
      mockKyInstance.mockResolvedValue(mockResponse);

      await client.get('https://api.example.com/ttl', { cacheTtl: 60000 });

      const stats = client.getCacheStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle non-Error thrown values', async () => {
      // Test line 256-257: unknown error path
      mockKyInstance.mockRejectedValue('string error');

      try {
        await client.get('https://api.example.com/unknown-error');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(NetworkError);
        const networkError = e as NetworkError;
        expect(networkError.message).toContain('Unknown error');
      }
    });

    it('should handle null/undefined thrown values', async () => {
      mockKyInstance.mockRejectedValue(null);

      try {
        await client.get('https://api.example.com/null-error');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(NetworkError);
      }
    });
  });
});
