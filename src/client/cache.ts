/**
 * Response caching implementation
 * @module client/cache
 */

import type { CacheEntry } from './types.js';

/**
 * In-memory cache for HTTP responses
 * Uses LRU (Least Recently Used) eviction when max size is reached
 *
 * @example
 * ```typescript
 * const cache = new ResponseCache(100, 60000); // 100 entries, 60s TTL
 * cache.set('key1', { data: 'value' });
 * const value = cache.get('key1');
 * ```
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  /**
   * Maximum number of entries to store
   * @private
   */
  private readonly maxSize: number;

  /**
   * Default TTL (Time To Live) in milliseconds
   * @private
   */
  private readonly defaultTtl: number;

  /**
   * Create a new ResponseCache
   *
   * @param maxSize - Maximum number of cache entries (default: 1000)
   * @param defaultTtl - Default TTL in milliseconds (default: 3600000 = 1 hour)
   */
  constructor(maxSize = 1000, defaultTtl = 3600000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get an item from cache if it exists and hasn't expired
   * Automatically removes expired entries
   *
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   *
   * @example
   * ```typescript
   * const data = cache.get<User>('user:123');
   * if (data) {
   *   console.log('Cache hit!', data);
   * }
   * ```
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.cachedAt > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return undefined;
    }

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);

    return entry.data as T;
  }

  /**
   * Store an item in cache
   * Evicts oldest entry if at max capacity
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   * @param etag - HTTP ETag header value (optional)
   * @param lastModified - HTTP Last-Modified header value (optional)
   *
   * @example
   * ```typescript
   * cache.set('user:123', userData, 300000); // 5 minute TTL
   * cache.set('api:data', response, undefined, 'etag-123');
   * ```
   */
  set<T>(key: string, data: T, ttl?: number, etag?: string, lastModified?: string): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      ttl: ttl ?? this.defaultTtl,
      etag: etag ?? '',
      lastModified: lastModified ?? '',
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Check if a key exists and hasn't expired
   *
   * @param key - Cache key to check
   * @returns True if key exists and hasn't expired
   *
   * @example
   * ```typescript
   * if (cache.has('user:123')) {
   *   console.log('User data is cached');
   * }
   * ```
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete an entry from cache
   *
   * @param key - Cache key to delete
   * @returns True if the entry existed and was deleted
   *
   * @example
   * ```typescript
   * cache.delete('user:123');
   * ```
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   *
   * @example
   * ```typescript
   * cache.clear(); // Remove all cached entries
   * ```
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * Get number of entries in cache
   *
   * @returns Current number of cached entries
   *
   * @example
   * ```typescript
   * console.log(`Cache has ${cache.size} entries`);
   * ```
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   *
   * @returns Object containing cache size, max size, and list of keys
   *
   * @example
   * ```typescript
   * const stats = cache.stats();
   * console.log(`Using ${stats.size}/${stats.maxSize} cache slots`);
   * console.log('Cached keys:', stats.entries);
   * ```
   */
  stats(): { size: number; maxSize: number; entries: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Evict expired entries
   * Removes all entries that have exceeded their TTL
   *
   * @returns Number of entries evicted
   *
   * @example
   * ```typescript
   * const evicted = cache.evictExpired();
   * console.log(`Evicted ${evicted} expired entries`);
   * ```
   */
  evictExpired(): number {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.cachedAt > entry.ttl) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * Evict the oldest (least recently used) entry
   * @private
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    // Find key with lowest access counter
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  /**
   * Generate a cache key from URL and options
   * Creates a deterministic key by sorting options alphabetically
   *
   * @param url - Request URL
   * @param options - Request options (optional)
   * @returns Cache key string
   *
   * @example
   * ```typescript
   * const key1 = ResponseCache.generateKey('/api/users', { page: 1, limit: 10 });
   * const key2 = ResponseCache.generateKey('/api/users', { limit: 10, page: 1 });
   * // key1 === key2 (options are sorted)
   * ```
   */
  static generateKey(url: string, options?: Record<string, unknown>): string {
    if (!options || Object.keys(options).length === 0) {
      return url;
    }

    // Sort keys for consistent hashing
    const sorted = Object.keys(options)
      .sort()
      .map((key) => `${key}=${JSON.stringify(options[key])}`)
      .join('&');

    return `${url}?${sorted}`;
  }
}
