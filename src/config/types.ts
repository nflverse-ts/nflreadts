/**
 * Configuration types for nflreadts
 * @module config/types
 */

/**
 * HTTP client configuration options
 */
export interface HttpConfig {
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout: number;

  /**
   * Number of retry attempts for failed requests
   * @default 3
   */
  retries: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay: number;

  /**
   * User agent string for HTTP requests
   * @default "nflreadts/{version}"
   */
  userAgent: string;

  /**
   * Custom headers to include in all requests
   * @default {}
   */
  headers: Record<string, string>;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Enable or disable caching
   * @default true
   */
  enabled: boolean;

  /**
   * Cache time-to-live in milliseconds
   * @default 3600000 (1 hour)
   */
  ttl: number;

  /**
   * Maximum number of items to cache
   * @default 100
   */
  maxSize: number;

  /**
   * Cache storage type
   * @default "memory"
   */
  storage: 'memory' | 'persistent';
}

/**
 * Data source URLs
 */
export interface DataSourceConfig {
  /**
   * Base URL for nflverse data
   * @default "https://github.com/nflverse/nflverse-data/releases/download"
   */
  baseUrl: string;

  /**
   * Alternative mirror URLs for failover
   * @default []
   */
  mirrors: string[];
}

/**
 * Logging configuration
 */
export interface LogConfig {
  /**
   * Enable debug logging
   * @default false
   */
  debug: boolean;

  /**
   * Log level
   * @default "warn"
   */
  level: 'error' | 'warn' | 'info' | 'debug';

  /**
   * Custom logger function
   */
  logger?: (level: string, message: string, ...args: unknown[]) => void;
}

/**
 * Main configuration interface
 */
export interface NflReadConfig {
  /**
   * HTTP client configuration
   */
  http: HttpConfig;

  /**
   * Cache configuration
   */
  cache: CacheConfig;

  /**
   * Data source configuration
   */
  dataSources: DataSourceConfig;

  /**
   * Logging configuration
   */
  logging: LogConfig;
}

/**
 * Partial configuration for user overrides
 * All fields are optional and can be partially specified
 */
export type PartialNflReadConfig = {
  http?: Partial<HttpConfig>;
  cache?: Partial<CacheConfig>;
  dataSources?: Partial<DataSourceConfig>;
  logging?: Partial<LogConfig>;
};

/**
 * Environment type
 */
export type Environment = 'node' | 'browser' | 'unknown';
