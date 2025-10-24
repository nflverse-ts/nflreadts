import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimiter } from '../../src/client/rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('constructor', () => {
    it('should create rate limiter with given configuration', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      expect(limiter).toBeDefined();
      expect(limiter.getAvailableTokens()).toBe(10);
    });

    it('should start with max tokens available', () => {
      const limiter = new RateLimiter({
        maxRequests: 100,
        interval: 60000,
      });

      const stats = limiter.stats();
      expect(stats.availableTokens).toBe(100);
      expect(stats.maxTokens).toBe(100);
    });
  });

  describe('acquire', () => {
    it('should immediately acquire token when available', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      const promise = limiter.acquire();
      await expect(promise).resolves.toBeUndefined();
      expect(limiter.getAvailableTokens()).toBe(9);
    });

    it('should consume tokens sequentially', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        interval: 1000,
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(4);

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(3);

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(2);
    });

    it('should wait when no tokens available', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        interval: 1000, // 2 tokens per second
      });

      // Consume all tokens
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(0);

      // This should wait
      const promise = limiter.acquire();

      // Advance time to refill tokens
      await vi.advanceTimersByTimeAsync(500); // Half interval = 1 token

      await promise;
      expect(limiter.getAvailableTokens()).toBe(0);
    });

    it('should handle multiple concurrent acquisitions', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        interval: 1000,
      });

      const promises = [limiter.acquire(), limiter.acquire(), limiter.acquire()];

      await Promise.all(promises);
      expect(limiter.getAvailableTokens()).toBe(0);
    });
  });

  describe('refill', () => {
    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      // Consume some tokens
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(8);

      // Advance time by half the interval (should refill 5 tokens)
      await vi.advanceTimersByTimeAsync(500);
      expect(limiter.getAvailableTokens()).toBe(10); // Capped at max
    });

    it('should not exceed max tokens', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      // Start with full tokens, advance time
      await vi.advanceTimersByTimeAsync(5000);

      expect(limiter.getAvailableTokens()).toBe(10); // Still capped at 10
    });

    it('should refill at correct rate', async () => {
      const limiter = new RateLimiter({
        maxRequests: 100,
        interval: 10000, // 100 tokens per 10 seconds = 10 per second
      });

      // Consume all tokens
      for (let i = 0; i < 100; i++) {
        await limiter.acquire();
      }
      expect(limiter.getAvailableTokens()).toBe(0);

      // Advance 1 second (should get 10 tokens)
      await vi.advanceTimersByTimeAsync(1000);
      expect(limiter.getAvailableTokens()).toBe(10);

      // Advance another second
      await vi.advanceTimersByTimeAsync(1000);
      expect(limiter.getAvailableTokens()).toBe(20);
    });
  });

  describe('getAvailableTokens', () => {
    it('should return current token count', () => {
      const limiter = new RateLimiter({
        maxRequests: 50,
        interval: 1000,
      });

      expect(limiter.getAvailableTokens()).toBe(50);
    });

    it('should update after acquiring tokens', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(9);

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(8);
    });
  });

  describe('getTimeUntilNextToken', () => {
    it('should return 0 when tokens are available', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      expect(limiter.getTimeUntilNextToken()).toBe(0);
    });

    it('should return wait time when no tokens available', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        interval: 1000, // 1 token per second
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(0);

      const waitTime = limiter.getTimeUntilNextToken();
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('reset', () => {
    it('should reset tokens to max', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      // Consume some tokens
      await limiter.acquire();
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(7);

      limiter.reset();
      expect(limiter.getAvailableTokens()).toBe(10);
    });

    it('should clear the queue', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        interval: 10000,
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(0);

      // Queue up some requests
      void limiter.acquire();
      void limiter.acquire();

      const statsBefore = limiter.stats();
      expect(statsBefore.queueLength).toBeGreaterThan(0);

      limiter.reset();

      const statsAfter = limiter.stats();
      expect(statsAfter.queueLength).toBe(0);
      expect(statsAfter.availableTokens).toBe(1);
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      const limiter = new RateLimiter({
        maxRequests: 25,
        interval: 5000,
      });

      const stats = limiter.stats();
      expect(stats).toEqual({
        availableTokens: 25,
        maxTokens: 25,
        queueLength: 0,
      });
    });

    it('should update stats after token consumption', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      await limiter.acquire();
      await limiter.acquire();

      const stats = limiter.stats();
      expect(stats.availableTokens).toBe(8);
      expect(stats.maxTokens).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle very small intervals', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 10, // 10ms
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(9);

      await vi.advanceTimersByTimeAsync(5); // 5ms = 5 tokens
      expect(limiter.getAvailableTokens()).toBe(10); // Capped
    });

    it('should handle very large intervals', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1000,
        interval: 3600000, // 1 hour
      });

      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(999);
    });

    it('should handle fractional token refills', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      // Consume some tokens
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(8);

      // Advance time by a small amount (should refill fractional tokens)
      await vi.advanceTimersByTimeAsync(150); // 1.5 tokens worth
      expect(limiter.getAvailableTokens()).toBe(9); // Floor of 9.5
    });
  });

  describe('realistic scenarios', () => {
    it('should handle typical API rate limit (100 requests/minute)', async () => {
      const limiter = new RateLimiter({
        maxRequests: 100,
        interval: 60000,
      });

      // Make 100 requests immediately
      const promises = Array.from({ length: 100 }, () => limiter.acquire());
      await Promise.all(promises);

      expect(limiter.getAvailableTokens()).toBe(0);

      // Wait 30 seconds (should refill 50 tokens)
      await vi.advanceTimersByTimeAsync(30000);
      expect(limiter.getAvailableTokens()).toBe(50);
    });

    it('should handle burst followed by sustained rate', async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
      });

      // Burst: consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.acquire();
      }
      expect(limiter.getAvailableTokens()).toBe(0);

      // Sustained: acquire at refill rate
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(100); // Wait for 1 token
        await limiter.acquire();
      }

      expect(limiter.getAvailableTokens()).toBe(0);
    });
  });
});
