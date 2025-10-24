/**
 * HTTP client implementation using ky
 * @module client/client
 */

import ky, { type KyInstance, type Options as KyOptions } from 'ky';

import { NetworkError, RequestAbortedError, TimeoutError } from '../types/error.js';
import { createLogger } from '../utils/logger.js';

import { ResponseCache } from './cache.js';
import { RateLimiter } from './rate-limiter.js';

import type { HttpClientConfig, HttpHooks, HttpResponse, RequestOptions } from './types.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<
  Omit<HttpClientConfig, 'baseUrl' | 'headers' | 'userAgent' | 'rateLimit'>
> = {
  timeout: 30000,
  retry: 3,
  cache: true,
  cacheTtl: 3600000, // 1 hour
  debug: false,
};

/**
 * HTTP client for making requests with caching and retry logic
 */
export class HttpClient {
  private client: KyInstance;
  private cache: ResponseCache;
  private rateLimiter?: RateLimiter;
  private config: HttpClientConfig;
  private hooks: HttpHooks = {};
  private logger = createLogger('HttpClient');

  constructor(config: HttpClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ResponseCache(1000, this.config.cacheTtl);

    // Initialize rate limiter if configured
    if (this.config.rateLimit) {
      this.rateLimiter = new RateLimiter(this.config.rateLimit);
    }

    // Create ky instance with configuration
    const kyOptions: KyOptions = {
      timeout: this.config.timeout ?? false,
      retry: {
        limit: this.config.retry ?? 3,
        methods: ['get', 'head', 'options', 'trace'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 3000,
      },
      headers: {
        'User-Agent': this.config.userAgent ?? `nflreadts/${this.getVersion()}`,
        ...this.config.headers,
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            if (this.config.debug) {
              this.logger.debug(`Request: ${request.method} ${request.url}`);
            }
            if (this.hooks.beforeRequest) {
              await this.hooks.beforeRequest(request.url, {} as RequestOptions);
            }
          },
        ],
        afterResponse: [
          async (request, _options, response) => {
            if (this.config.debug) {
              this.logger.debug(`Response: ${response.status} ${request.url}`);
            }
            return (
              (await this.hooks.afterResponse?.({
                data: await response
                  .clone()
                  .json()
                  .catch(() => undefined),
                status: response.status,
                headers: {},
                fromCache: false,
                url: request.url,
              })) ?? response
            );
          },
        ],
      },
    };

    if (this.config.baseUrl) {
      kyOptions.prefixUrl = this.config.baseUrl;
    }

    this.client = ky.create(kyOptions);
  }

  /**
   * Set hooks for request/response interception
   */
  setHooks(hooks: HttpHooks): void {
    this.hooks = hooks;
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'get' });
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'post',
      json: data,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'put',
      json: data,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'delete' });
  }

  /**
   * Make a HEAD request
   */
  async head(url: string, options: RequestOptions = {}): Promise<HttpResponse<void>> {
    return this.request<void>(url, { ...options, method: 'head' });
  }

  /**
   * Core request method
   */
  private async request<T>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    const {
      cache = this.config.cache,
      cacheTtl = this.config.cacheTtl,
      cacheKey,
      timeout = this.config.timeout,
      retry = this.config.retry,
      signal,
      ...kyOptions
    } = options;

    // Only cache GET requests by default
    const shouldCache = cache && (options.method === 'get' || options.method === undefined);
    const finalCacheKey = cacheKey ?? ResponseCache.generateKey(url, kyOptions);

    // Check cache first
    if (shouldCache) {
      const cached = this.cache.get<T>(finalCacheKey);
      if (cached !== undefined) {
        if (this.config.debug) {
          this.logger.debug(`Cache hit: ${url}`);
        }

        const response: HttpResponse<T> = {
          data: cached,
          status: 200,
          headers: {},
          fromCache: true,
          url,
        };

        if (this.hooks.afterResponse) {
          await this.hooks.afterResponse(response);
        }

        return response;
      }
    }

    // Apply rate limiting if configured
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
      if (this.config.debug) {
        const stats = this.rateLimiter.stats();
        this.logger.debug(
          `Rate limiter: ${stats.availableTokens}/${stats.maxTokens} tokens available`
        );
      }
    }

    // Make request
    try {
      const kyRequestOptions: KyOptions = {
        ...kyOptions,
        timeout: timeout ?? false,
        retry: {
          limit: retry ?? 3,
          methods: ['get', 'head', 'options', 'trace'],
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
        },
        ...(signal && { signal }),
      };

      const response = await this.client(url, kyRequestOptions);

      // Parse response based on content type or explicit format
      const contentType = response.headers.get('content-type') ?? '';
      let data: T;

      if (contentType.includes('application/json')) {
        data = (await response.json()) as T;
      } else if (contentType.includes('text/')) {
        data = (await response.text()) as T;
      } else {
        // Default to arrayBuffer for binary data
        data = (await response.arrayBuffer()) as T;
      }

      // Cache successful responses
      if (shouldCache && response.ok) {
        const etag = response.headers.get('etag') ?? undefined;
        const lastModified = response.headers.get('last-modified') ?? undefined;
        this.cache.set(finalCacheKey, data, cacheTtl, etag, lastModified);
      }

      // Build response object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        headers,
        fromCache: false,
        url: response.url,
      };

      if (this.hooks.afterResponse) {
        await this.hooks.afterResponse(httpResponse);
      }

      return httpResponse;
    } catch (error) {
      // Transform errors
      let nflError: Error;

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          nflError = new TimeoutError(`Request timeout: ${url}`, { url, timeout });
        } else if (error.name === 'AbortError') {
          nflError = new RequestAbortedError(`Request aborted: ${url}`, { url });
        } else {
          nflError = new NetworkError(`Network request failed: ${error.message}`, { url }, error);
        }
      } else {
        nflError = new NetworkError(`Unknown error during request: ${url}`, { url });
      }

      if (this.hooks.onError) {
        await this.hooks.onError(nflError, url);
      }

      throw nflError;
    }
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; entries: string[] } {
    return this.cache.stats();
  }

  /**
   * Evict expired cache entries
   */
  evictExpiredCache(): number {
    return this.cache.evictExpired();
  }

  /**
   * Get rate limiter statistics
   */
  getRateLimiterStats(): {
    availableTokens: number;
    maxTokens: number;
    queueLength: number;
  } | null {
    return this.rateLimiter?.stats() ?? null;
  }

  /**
   * Reset rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter?.reset();
  }

  /**
   * Get package version
   */
  private getVersion(): string {
    // This will be replaced with actual version from package.json
    return '0.1.0';
  }
}

/**
 * Create a new HTTP client instance
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
