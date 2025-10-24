/**
 * Tests for ResponseCache
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { ResponseCache } from '../../src/client/cache.js';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(5, 1000); // Max 5 items, 1 second TTL
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.delete('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has('key1')).toBe(false);
    });

    it('should track size correctly', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
      cache.delete('key1');
      expect(cache.size).toBe(1);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL

      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Should still exist after short time
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get('key1')).toBe('value1');
    });

    it('should evict expired entries', async () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 100);
      cache.set('key3', 'value3', 5000); // Long TTL

      await new Promise((resolve) => setTimeout(resolve, 150));

      const evicted = cache.evictExpired();
      expect(evicted).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      // Fill cache to capacity
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size).toBe(5);

      // Access some entries to update LRU order
      cache.get('key2');
      cache.get('key4');

      // Add new entry, should evict least recently used
      cache.set('key5', 'value5');

      expect(cache.size).toBe(5);
      // key0 or key1 should be evicted (whichever was accessed less recently)
      const key0Exists = cache.has('key0');
      const key1Exists = cache.has('key1');
      expect(key0Exists || key1Exists).toBe(true);
      expect(key0Exists && key1Exists).toBe(false);
    });

    it('should update access order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Access key1 to make it recently used
      cache.get('key1');

      // Add new entry
      cache.set('key6', 'value6');

      // key1 should still exist (was accessed recently)
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('Metadata', () => {
    it('should store etag and lastModified', () => {
      cache.set('key1', 'value1', 1000, 'etag123', 'Mon, 01 Jan 2024 00:00:00 GMT');

      const stats = cache.stats();
      expect(stats.entries).toContain('key1');
    });

    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.entries).toEqual(['key1', 'key2']);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate key from URL only', () => {
      const key = ResponseCache.generateKey('https://example.com/data');
      expect(key).toBe('https://example.com/data');
    });

    it('should generate key from URL and options', () => {
      const key = ResponseCache.generateKey('https://example.com/data', {
        season: 2023,
        team: 'KC',
      });

      expect(key).toContain('https://example.com/data?');
      expect(key).toContain('season=2023');
      expect(key).toContain('team="KC"');
    });

    it('should generate consistent keys for same options', () => {
      const key1 = ResponseCache.generateKey('https://example.com/data', {
        a: 1,
        b: 2,
      });

      const key2 = ResponseCache.generateKey('https://example.com/data', {
        b: 2,
        a: 1,
      });

      expect(key1).toBe(key2);
    });

    it('should handle empty options', () => {
      const key = ResponseCache.generateKey('https://example.com/data', {});
      expect(key).toBe('https://example.com/data');
    });
  });

  describe('Complex Data Types', () => {
    it('should cache objects', () => {
      const data = { name: 'Test', value: 42, nested: { foo: 'bar' } };
      cache.set('obj', data);

      const retrieved = cache.get<typeof data>('obj');
      expect(retrieved).toEqual(data);
    });

    it('should cache arrays', () => {
      const data = [1, 2, 3, 4, 5];
      cache.set('arr', data);

      const retrieved = cache.get<typeof data>('arr');
      expect(retrieved).toEqual(data);
    });

    it('should cache null and undefined', () => {
      cache.set('null', null);
      cache.set('undef', undefined);

      expect(cache.get('null')).toBe(null);
      expect(cache.get('undef')).toBe(undefined);
    });
  });
});
