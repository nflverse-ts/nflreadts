/**
 * Rate limiter implementation using token bucket algorithm
 * @module client/rate-limiter
 */

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /**
   * Maximum number of requests per interval
   * @default 100
   */
  maxRequests: number;

  /**
   * Time interval in milliseconds
   * @default 60000 (1 minute)
   */
  interval: number;
}

/**
 * Token bucket rate limiter
 * Allows burst requests up to maxRequests, then refills tokens at a constant rate
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ maxRequests: 10, interval: 1000 }); // 10 req/sec
 * await limiter.acquire(); // Waits if no tokens available
 * // Make request here
 * ```
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly queue: Array<() => void> = [];

  /**
   * Create a new RateLimiter
   *
   * @param config - Rate limiter configuration
   *
   * @example
   * ```typescript
   * const limiter = new RateLimiter({
   *   maxRequests: 100,
   *   interval: 60000 // 100 requests per minute
   * });
   * ```
   */
  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxRequests;
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
    // Tokens per millisecond
    this.refillRate = config.maxRequests / config.interval;
  }

  /**
   * Refill tokens based on time elapsed
   * @private
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to acquire a token
   * @private
   * @returns True if token was acquired, false otherwise
   */
  private tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Wait until a token is available
   * Returns a promise that resolves when a token is acquired
   * This is the main method to call before making a rate-limited request
   *
   * @returns Promise that resolves when a token is acquired
   *
   * @example
   * ```typescript
   * await limiter.acquire(); // Blocks until token available
   * const response = await fetch('/api/data');
   * ```
   */
  async acquire(): Promise<void> {
    if (this.tryAcquire()) {
      return Promise.resolve();
    }

    // Calculate wait time for next token
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);

    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.queue.shift();
        void this.acquire().then(resolve);
      }, waitTime);

      this.queue.push(() => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  /**
   * Get current token count
   * Tokens are automatically refilled before returning
   *
   * @returns Number of available tokens (floored to integer)
   *
   * @example
   * ```typescript
   * const available = limiter.getAvailableTokens();
   * console.log(`${available} requests available`);
   * ```
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token is available (in ms)
   * Returns 0 if tokens are currently available
   *
   * @returns Milliseconds until next token is available
   *
   * @example
   * ```typescript
   * const waitTime = limiter.getTimeUntilNextToken();
   * console.log(`Need to wait ${waitTime}ms`);
   * ```
   */
  getTimeUntilNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    return Math.ceil((1 - this.tokens) / this.refillRate);
  }

  /**
   * Reset the rate limiter
   * Restores tokens to maximum and clears the queue
   *
   * @example
   * ```typescript
   * limiter.reset(); // Reset to full capacity
   * ```
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue.length = 0;
  }

  /**
   * Get stats about the rate limiter
   *
   * @returns Object containing current state information
   *
   * @example
   * ```typescript
   * const stats = limiter.stats();
   * console.log(`${stats.availableTokens}/${stats.maxTokens} tokens`);
   * console.log(`${stats.queueLength} requests queued`);
   * ```
   */
  stats(): { availableTokens: number; maxTokens: number; queueLength: number } {
    return {
      availableTokens: this.getAvailableTokens(),
      maxTokens: this.maxTokens,
      queueLength: this.queue.length,
    };
  }
}
