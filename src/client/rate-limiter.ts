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
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly queue: Array<() => void> = [];

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxRequests;
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
    // Tokens per millisecond
    this.refillRate = config.maxRequests / config.interval;
  }

  /**
   * Refill tokens based on time elapsed
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
   * Returns true if token was acquired, false otherwise
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
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token is available (in ms)
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
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue.length = 0;
  }

  /**
   * Get stats about the rate limiter
   */
  stats(): { availableTokens: number; maxTokens: number; queueLength: number } {
    return {
      availableTokens: this.getAvailableTokens(),
      maxTokens: this.maxTokens,
      queueLength: this.queue.length,
    };
  }
}
