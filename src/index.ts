/**
 * nflreadts - TypeScript port of nflreadpy/nflreadr
 * Access NFL data from the nflverse ecosystem
 *
 * @packageDocumentation
 */

// Version
export { version } from './version.js';

// ============================================================================
// DATA LOADING FUNCTIONS - Main API
// ============================================================================

export {
  loadDepthCharts,
  loadParticipation,
  loadPbp,
  loadPlayers,
  loadPlayerStats,
  loadRosters,
} from './data/index.js';

// ============================================================================
// CONFIGURATION - User-facing configuration
// ============================================================================

export { configure, getConfig } from './config/index.js';

export type { NflReadConfig, PartialNflReadConfig } from './config/index.js';

// ============================================================================
// DATA TYPES - Types users need for function parameters and return values
// ============================================================================

// Record types (function return values)
export type {
  DepthChartRecord,
  ParticipationRecord,
  PlayByPlayRecord,
  PlayerRecord,
  PlayerStatsRecord,
  RosterRecord,
} from './types/index.js';

// Options types (function parameters)
export type {
  LoadDepthChartsOptions,
  LoadOptions,
  LoadParticipationOptions,
  LoadPbpOptions,
  LoadPlayersOptions,
  LoadPlayerStatsOptions,
  LoadRostersOptions,
} from './types/index.js';

// Common types used in data
export type {
  Conference,
  Division,
  GameId,
  GameType,
  PlayerId,
  Position,
  Season,
  SeasonType,
  TeamAbbr,
  Week,
} from './types/index.js';

// ============================================================================
// ERROR TYPES - For error handling
// ============================================================================

export type {
  DataNotFoundError,
  ErrorCode,
  InvalidDataError,
  NetworkError,
  NflReadError,
  RateLimitError,
  RequestAbortedError,
  TimeoutError,
  ValidationError,
} from './types/index.js';
