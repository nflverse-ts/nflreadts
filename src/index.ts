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
  loadCombine,
  loadContracts,
  loadDepthCharts,
  loadDraftPicks,
  loadFfOpportunity,
  loadFfPlayerids,
  loadFfRankings,
  loadFtnCharting,
  loadInjuries,
  loadNextgenStats,
  loadOfficials,
  loadParticipation,
  loadPbp,
  loadPfrAdvstats,
  loadPlayers,
  loadPlayerStats,
  loadRosters,
  loadRostersWeekly,
  loadSchedules,
  loadSnapCounts,
  loadTeams,
  loadTeamStats,
  loadTrades,
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
  CombineRecord,
  ContractRecord,
  ContractSeasonDetail,
  DepthChartRecord,
  DraftPickRecord,
  FfOpportunityRecord,
  FfPlayeridsRecord,
  FfRankingsRecord,
  FtnChartingRecord,
  InjuryRecord,
  NextgenStatsRecord,
  OfficialRecord,
  ParticipationRecord,
  PfrAdvstatsRecord,
  PlayByPlayRecord,
  PlayerRecord,
  PlayerStatsRecord,
  RosterRecord,
  ScheduleRecord,
  SnapCountRecord,
  TeamRecord,
  TeamStatsRecord,
  TradeRecord,
  WeeklyRosterRecord,
} from './types/index.js';

// Options types (function parameters)
export type {
  FfOpportunityModelVersion,
  FfOpportunityStatType,
  FfRankingsType,
  LoadCombineOptions,
  LoadContractsOptions,
  LoadDepthChartsOptions,
  LoadDraftPicksOptions,
  LoadFfOpportunityOptions,
  LoadFtnChartingOptions,
  LoadInjuriesOptions,
  LoadNextgenStatsOptions,
  LoadOfficialsOptions,
  LoadOptions,
  LoadParticipationOptions,
  LoadPbpOptions,
  LoadPfrAdvstatsOptions,
  LoadPlayersOptions,
  LoadPlayerStatsOptions,
  LoadRostersOptions,
  LoadRostersWeeklyOptions,
  LoadSchedulesOptions,
  LoadSnapCountsOptions,
  LoadTeamsOptions,
  LoadTeamStatsOptions,
  LoadTradesOptions,
  SummaryLevel,
} from './types/index.js';

// Stat-type unions for the advanced loaders
export type { NgsStatType, PfrStatType, PfrSummaryLevel } from './utils/url.js';

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

// ============================================================================
// DATETIME - Season and week utilities
// ============================================================================

export {
  addDays,
  daysBetween,
  formatDate,
  formatDateLong,
  formatDateShort,
  generateSeasonRange,
  generateWeekRange,
  getCurrentSeason,
  getCurrentWeek,
  getSeasonEndDate,
  getSeasonFlipDate,
  getSeasonFromDate,
  getSeasonStartDate,
  getToday,
  getWeeksForSeasonType,
  isDateInSeason,
  isFutureDate,
  isPastDate,
  parseDate,
} from './utils/datetime.js';

/**
 * Alias for {@link getCurrentSeason}, matching nflreadr's most_recent_season().
 * The season flips to the new year on the Wednesday after Labor Day.
 */
export { getCurrentSeason as mostRecentSeason } from './utils/datetime.js';
