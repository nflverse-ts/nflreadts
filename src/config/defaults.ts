/**
 * Default configuration values
 * @module config/defaults
 */

import { version } from '../version.js';

import type { Environment, NflReadConfig } from './types.js';

/**
 * Detect the current runtime environment
 */
export function detectEnvironment(): Environment {
  // Check for Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }

  // Check for browser
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const hasWindow = typeof (globalThis as any).window !== 'undefined';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const hasDocument = typeof (globalThis as any).document !== 'undefined';

  if (hasWindow && hasDocument) {
    return 'browser';
  }

  return 'unknown';
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: NflReadConfig = {
  http: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    userAgent: `nflreadts/${version}`,
    headers: {},
  },
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
    maxSize: 100,
    storage: 'memory',
  },
  dataSources: {
    baseUrl: 'https://github.com/nflverse/nflverse-data/releases/download',
    mirrors: [],
  },
  logging: {
    debug: false,
    level: 'warn',
  },
};

/**
 * Get environment-specific default overrides
 */
export function getEnvironmentDefaults(env: Environment): Partial<NflReadConfig> {
  switch (env) {
    case 'node':
      return {
        // Could enable persistent cache in Node.js
        // No overrides needed for now
      };
    case 'browser':
      return {
        cache: {
          // Browser has memory constraints
          maxSize: 50,
          enabled: true,
          ttl: 1800000, // 30 minutes
          storage: 'memory',
        },
      };
    default:
      return {};
  }
}
