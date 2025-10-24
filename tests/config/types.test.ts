/**
 * Tests for configuration types
 */

import { describe, it, expect } from 'vitest';

import type { NflReadConfig, PartialNflReadConfig } from '../../src/config/types.js';

describe('Config Types', () => {
  it('should allow full NflReadConfig object', () => {
    const config: NflReadConfig = {
      http: {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        userAgent: 'test',
        headers: {},
      },
      cache: {
        enabled: true,
        ttl: 3600000,
        maxSize: 100,
        storage: 'memory',
      },
      dataSources: {
        baseUrl: 'https://example.com',
        mirrors: [],
      },
      logging: {
        debug: false,
        level: 'warn',
      },
    };

    expect(config).toBeDefined();
    expect(config.http.timeout).toBe(30000);
  });

  it('should allow partial config', () => {
    const partialConfig: PartialNflReadConfig = {
      http: {
        timeout: 60000,
      },
      cache: {
        enabled: false,
      },
    };

    expect(partialConfig).toBeDefined();
    expect(partialConfig.http?.timeout).toBe(60000);
  });

  it('should allow empty partial config', () => {
    const emptyConfig: PartialNflReadConfig = {};
    expect(emptyConfig).toBeDefined();
  });
});
