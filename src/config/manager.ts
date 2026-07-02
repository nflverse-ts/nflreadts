/**
 * Configuration manager for nflreadts
 * @module config/manager
 */

import { DEFAULT_CONFIG, detectEnvironment, getEnvironmentDefaults } from './defaults.js';

import type { NflReadConfig, PartialNflReadConfig } from './types.js';

/**
 * Deep merge two objects
 * Later object properties override earlier ones
 */
function deepMerge(target: NflReadConfig, source: PartialNflReadConfig): NflReadConfig {
  const result: NflReadConfig = { ...target };

  // Merge http config
  if (source.http) {
    result.http = { ...target.http, ...source.http };
  }

  // Merge cache config
  if (source.cache) {
    result.cache = { ...target.cache, ...source.cache };
  }

  // Merge dataSources config
  if (source.dataSources) {
    result.dataSources = { ...target.dataSources, ...source.dataSources };
  }

  // Merge logging config
  if (source.logging) {
    result.logging = { ...target.logging, ...source.logging };
  }

  return result;
}

/**
 * Configuration manager class
 * Follows the Singleton pattern to ensure consistent config across the application
 *
 * @example
 * ```typescript
 * const manager = ConfigManager.getInstance({ http: { timeout: 5000 } });
 * const config = manager.getConfig();
 * ```
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: NflReadConfig;

  /**
   * Private constructor to enforce singleton pattern
   * @private
   * @param userConfig - Optional user configuration to merge with defaults
   */
  private constructor(userConfig?: PartialNflReadConfig) {
    const env = detectEnvironment();
    const envDefaults = getEnvironmentDefaults(env);

    // Merge: defaults -> environment defaults -> user config
    let config = { ...DEFAULT_CONFIG };
    config = deepMerge(config, envDefaults);
    if (userConfig) {
      config = deepMerge(config, userConfig);
    }

    this.config = config;
  }

  /**
   * Get the singleton instance
   * Creates new instance on first call, reuses on subsequent calls
   *
   * @param userConfig - Optional user configuration (only used on first call or to update)
   * @returns ConfigManager singleton instance
   *
   * @example
   * ```typescript
   * const manager = ConfigManager.getInstance();
   * // Or with custom config:
   * const manager = ConfigManager.getInstance({ cache: { enabled: false } });
   * ```
   */
  public static getInstance(userConfig?: PartialNflReadConfig): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(userConfig);
    } else if (userConfig) {
      // If instance exists and new config provided, merge it in
      ConfigManager.instance.update(userConfig);
    }
    return ConfigManager.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   *
   * @example
   * ```typescript
   * // In test teardown
   * ConfigManager.reset();
   * ```
   */
  public static reset(): void {
    ConfigManager.instance = null;
  }

  /**
   * Get the current configuration
   * Returns a readonly copy to prevent accidental mutations
   *
   * @returns Current configuration (readonly)
   *
   * @example
   * ```typescript
   * const config = manager.getConfig();
   * console.log(config.http.timeout);
   * ```
   */
  public getConfig(): Readonly<NflReadConfig> {
    return this.config;
  }

  /**
   * Get a specific configuration value by path
   */
  public get<K extends keyof NflReadConfig>(section: K): Readonly<NflReadConfig[K]>;
  public get<K extends keyof NflReadConfig, S extends keyof NflReadConfig[K]>(
    section: K,
    key: S
  ): Readonly<NflReadConfig[K][S]>;
  public get<K extends keyof NflReadConfig, S extends keyof NflReadConfig[K]>(
    section: K,
    key?: S
  ): Readonly<NflReadConfig[K]> | Readonly<NflReadConfig[K][S]> {
    if (key === undefined) {
      return this.config[section];
    }
    return this.config[section][key];
  }

  /**
   * Update configuration with new values
   * Merges new values with existing configuration
   *
   * @param userConfig - Partial configuration to merge
   *
   * @example
   * ```typescript
   * manager.update({ logging: { debug: true } });
   * ```
   */
  public update(userConfig: PartialNflReadConfig): void {
    this.config = deepMerge(this.config, userConfig);
  }

  /**
   * Reset configuration to defaults (with environment-specific overrides)
   * Clears all user customizations
   *
   * @example
   * ```typescript
   * manager.resetToDefaults(); // Back to original defaults
   * ```
   */
  public resetToDefaults(): void {
    const env = detectEnvironment();
    const envDefaults = getEnvironmentDefaults(env);
    this.config = deepMerge({ ...DEFAULT_CONFIG }, envDefaults);
  }
}

/**
 * Convenience function to get the current configuration
 * Shortcut for ConfigManager.getInstance().getConfig()
 *
 * @returns Current configuration (readonly)
 *
 * @example
 * ```typescript
 * import { getConfig } from './config';
 * const config = getConfig();
 * console.log(config.http.timeout);
 * ```
 */
export function getConfig(): Readonly<NflReadConfig> {
  return ConfigManager.getInstance().getConfig();
}

/**
 * Convenience function to configure nflreadts
 * Shortcut for ConfigManager.getInstance(config)
 *
 * @param userConfig - User configuration to apply
 *
 * @example
 * ```typescript
 * import { configure } from './config';
 * configure({
 *   http: { timeout: 10000 },
 *   cache: { enabled: true, ttl: 300000 }
 * });
 * ```
 */
export function configure(userConfig: PartialNflReadConfig): void {
  ConfigManager.getInstance(userConfig);
}
