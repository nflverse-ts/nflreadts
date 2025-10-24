/**
 * Environment variable support for configuration
 * @module config/env
 */

import type { PartialNflReadConfig } from './types.js';

/**
 * Get environment variable value (Node.js only)
 */
function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Parse boolean from string
 */
function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const lower = value.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes') return true;
  if (lower === 'false' || lower === '0' || lower === 'no') return false;
  return undefined;
}

/**
 * Parse number from string
 */
function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Load configuration from environment variables
 * Environment variable format: NFLREADTS_<SECTION>_<KEY>
 *
 * Examples:
 * - NFLREADTS_HTTP_TIMEOUT=60000
 * - NFLREADTS_CACHE_ENABLED=true
 * - NFLREADTS_LOGGING_DEBUG=true
 */
export function loadConfigFromEnv(): PartialNflReadConfig {
  const config: PartialNflReadConfig = {};

  // HTTP configuration
  const httpTimeout = parseNumber(getEnvVar('NFLREADTS_HTTP_TIMEOUT'));
  const httpRetries = parseNumber(getEnvVar('NFLREADTS_HTTP_RETRIES'));
  const httpRetryDelay = parseNumber(getEnvVar('NFLREADTS_HTTP_RETRY_DELAY'));
  const httpUserAgent = getEnvVar('NFLREADTS_HTTP_USER_AGENT');

  if (
    httpTimeout !== undefined ||
    httpRetries !== undefined ||
    httpRetryDelay !== undefined ||
    httpUserAgent !== undefined
  ) {
    config.http = {};
    if (httpTimeout !== undefined) config.http.timeout = httpTimeout;
    if (httpRetries !== undefined) config.http.retries = httpRetries;
    if (httpRetryDelay !== undefined) config.http.retryDelay = httpRetryDelay;
    if (httpUserAgent !== undefined) config.http.userAgent = httpUserAgent;
  }

  // Cache configuration
  const cacheEnabled = parseBoolean(getEnvVar('NFLREADTS_CACHE_ENABLED'));
  const cacheTtl = parseNumber(getEnvVar('NFLREADTS_CACHE_TTL'));
  const cacheMaxSize = parseNumber(getEnvVar('NFLREADTS_CACHE_MAX_SIZE'));

  if (cacheEnabled !== undefined || cacheTtl !== undefined || cacheMaxSize !== undefined) {
    config.cache = {};
    if (cacheEnabled !== undefined) config.cache.enabled = cacheEnabled;
    if (cacheTtl !== undefined) config.cache.ttl = cacheTtl;
    if (cacheMaxSize !== undefined) config.cache.maxSize = cacheMaxSize;
  }

  // Data sources configuration
  const dataSourceBaseUrl = getEnvVar('NFLREADTS_DATA_SOURCE_BASE_URL');

  if (dataSourceBaseUrl !== undefined) {
    config.dataSources = {
      baseUrl: dataSourceBaseUrl,
    };
  }

  // Logging configuration
  const loggingDebug = parseBoolean(getEnvVar('NFLREADTS_LOGGING_DEBUG'));
  const loggingLevel = getEnvVar('NFLREADTS_LOGGING_LEVEL');

  if (loggingDebug !== undefined || loggingLevel !== undefined) {
    config.logging = {};
    if (loggingDebug !== undefined) config.logging.debug = loggingDebug;
    if (loggingLevel !== undefined && ['error', 'warn', 'info', 'debug'].includes(loggingLevel)) {
      config.logging.level = loggingLevel as 'error' | 'warn' | 'info' | 'debug';
    }
  }

  return config;
}
