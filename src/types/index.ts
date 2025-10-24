/**
 * Type definitions for nflreadts
 * @module types
 */

// Common types
export type {
  Conference,
  DateString,
  Division,
  Down,
  FullDivision,
  GameId,
  GameStatus,
  PlayerId,
  PlayId,
  PlayType,
  Position,
  Season,
  SeasonType,
  Side,
  TeamAbbr,
  Timestamp,
  Week,
} from './common.js';

// Team types
export type {
  AnyTeamAbbr,
  HistoricalTeamAbbr,
  Team,
  TeamColors,
  TeamMap,
  ValidTeamAbbr,
} from './team.js';

export { HISTORICAL_TEAMS, NFL_TEAMS } from './team.js';

// Player types
export type {
  DefensiveStats,
  KickingStats,
  PassingStats,
  Player,
  PlayerStats,
  PlayerStatus,
  ReceivingStats,
  RosterEntry,
  RushingStats,
} from './player.js';

// Utility types
export type {
  ArrayElement,
  DataState,
  DeepReadonly,
  FilterOptions,
  LoadOptions,
  Nullable,
  NullableFields,
  OptionalFields,
  PaginatedResponse,
  Range,
  RequireFields,
  SeasonRange,
  UnwrapPromise,
  WeekRange,
} from './utils.js';

export { isError, isLoading, isSuccess } from './utils.js';

// Error types
export {
  DataNotFoundError,
  ErrorCode,
  InvalidDataError,
  NetworkError,
  NflReadError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from './error.js';

export type { Result } from './error.js';

export { Err, isErr, isOk, mapError, mapResult, Ok, unwrap, unwrapOr } from './error.js';
