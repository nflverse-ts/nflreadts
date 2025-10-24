/**
 * Response caching implementation
 * @module client/cache
 */

import type { CacheEntry } from './types.js';

/**
 * In-memory cache for HTTP responses
 * Uses LRU-style eviction when max size is reached
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  /**
   * Maximum number of entries to store
   */
  private readonly maxSize: number;

  /**
   * Default TTL in milliseconds
   */
  private readonly defaultTtl: number;

  constructor(maxSize = 1000, defaultTtl = 3600000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get an item from cache if it exists and hasn't expired
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
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete an entry from cache
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * Get number of entries in cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
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
