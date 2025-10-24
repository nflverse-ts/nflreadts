/**
 * Configuration module for nflreadts
 * @module config
 */

export { ConfigManager, configure, getConfig } from './manager.js';
export { DEFAULT_CONFIG, detectEnvironment, getEnvironmentDefaults } from './defaults.js';
export { loadConfigFromEnv } from './env.js';
export type {
  NflReadConfig,
  PartialNflReadConfig,
  HttpConfig,
  CacheConfig,
  DataSourceConfig,
  LogConfig,
  Environment,
} from './types.js';
