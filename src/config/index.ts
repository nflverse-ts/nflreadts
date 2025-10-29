/**
 * Configuration module for nflreadts
 * @module config
 */

// Public API - User-facing configuration functions
export { configure, getConfig } from './manager.js';

// Public API - Configuration types
export type { NflReadConfig, PartialNflReadConfig } from './types.js';
