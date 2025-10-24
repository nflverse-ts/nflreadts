/**
 * HTTP client types and interfaces
 * @module client/types
 */

import type { Options as KyOptions } from 'ky';

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  /**
   * Base URL for all requests
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests
   * @default 3
   */
  retry?: number;

  /**
   * Enable response caching
   * @default true
   */
  cache?: boolean;

  /**
   * Default cache TTL in milliseconds
   * @default 3600000 (1 hour)
   */
  cacheTtl?: number;

  /**
   * Custom headers to include with all requests
   */
  headers?: Record<string, string>;

  /**
   * User agent string
   * @default 'nflreadts/{version}'
   */
  userAgent?: string;

  /**
   * Enable request/response logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Request options for individual requests
 */
export interface RequestOptions extends Omit<KyOptions, 'timeout' | 'retry'> {
  /**
   * Request-specific timeout (overrides client config)
   */
  timeout?: number;

  /**
   * Request-specific retry count (overrides client config)
   */
  retry?: number;

  /**
   * Cache this specific request
   * @default true
   */
  cache?: boolean;

  /**
   * Cache TTL for this specific request
   */
  cacheTtl?: number;

  /**
   * Cache key (auto-generated if not provided)
   */
  cacheKey?: string;
}

/**
 * Cached response entry
 */
export interface CacheEntry<T = unknown> {
  /**
   * Cached data
   */
  data: T;

  /**
   * Timestamp when cached (ms)
   */
  cachedAt: number;

  /**
   * Time-to-live in milliseconds
   */
  ttl: number;

  /**
   * ETag from response (if available)
   */
  etag?: string;

  /**
   * Last-Modified from response (if available)
   */
  lastModified?: string;
}

/**
 * HTTP response with metadata
 */
export interface HttpResponse<T = unknown> {
  /**
   * Response data
   */
  data: T;

  /**
   * HTTP status code
   */
  status: number;

  /**
   * Response headers
   */
  headers: Record<string, string>;

  /**
   * Whether response came from cache
   */
  fromCache: boolean;

  /**
   * Request URL
   */
  url: string;
}

/**
 * Response format type
 */
export type ResponseFormat = 'json' | 'text' | 'blob' | 'arrayBuffer';

/**
 * Hook functions for request/response interception
 */
export interface HttpHooks {
  /**
   * Called before each request
   */
  beforeRequest?: (url: string, options: RequestOptions) => void | Promise<void>;

  /**
   * Called after successful response
   */
  afterResponse?: <T>(response: HttpResponse<T>) => void | Promise<void>;

  /**
   * Called on request error
   */
  onError?: (error: Error, url: string) => void | Promise<void>;
}
