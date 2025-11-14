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
  loadSchedules,
  loadTeams,
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
  ScheduleRecord,
  TeamRecord,
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
  LoadSchedulesOptions,
  LoadTeamsOptions,
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

// ============================================================================
// RESULT TYPE - Functional error handling
// ============================================================================

export type { Result } from './types/index.js';
export { Err, Ok, isErr, isOk, mapError, mapResult, unwrap, unwrapOr } from './types/index.js';

// ============================================================================
// VALIDATION - Input validation and type coercion
// ============================================================================

// Validation result types
export type {
  ArrayValidationOptions,
  SeasonValidationOptions,
  TeamValidationOptions,
  ValidationResult,
  WeekValidationOptions,
} from './validation/index.js';

// Core validation functions (boolean checks)
export {
  isValidSeason,
  isValidSeasonType,
  isValidTeam,
  isValidTeamOrHistorical,
  isValidWeek,
} from './validation/index.js';

// Assert functions (throw on invalid)
export {
  assertValidSeason,
  assertValidSeasonType,
  assertValidTeam,
  assertValidWeek,
} from './validation/index.js';

// Validation with coercion
export {
  validateSeason,
  validateSeasons,
  validateSeasonTypeInput,
  validateTeam,
  validateTeams,
  validateWeek,
} from './validation/index.js';

// Runtime type guards
export {
  isAnyTeamAbbrType,
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveInteger,
  isSeasonType,
  isSeasonTypeType,
  isTeamAbbrType,
  isWeekType,
} from './validation/index.js';

// Type coercion utilities
export {
  coerceToArray,
  coerceToInteger,
  coerceToNumber,
  coerceToString,
  coerceToUppercase,
} from './validation/index.js';

// Sanitization utilities
export { sanitizeArray, sanitizeNumber, sanitizeString } from './validation/index.js';

// Normalization utilities
export { normalizeTeamAbbr } from './validation/index.js';
