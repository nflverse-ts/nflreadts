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

export { HISTORICAL_TEAMS, MIN_PARTICIPATION_SEASON, NFL_TEAMS } from './constants.js';

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
  RequestAbortedError,
  TimeoutError,
  ValidationError,
} from './error.js';

export type { Result } from './error.js';

export { Err, isErr, isOk, mapError, mapResult, Ok, unwrap, unwrapOr } from './error.js';

// Play-by-play types
export type { LoadPbpOptions, PlayByPlayData, PlayByPlayRecord } from './pbp.js';

// Participation types
export type {
  LoadParticipationOptions,
  ParticipationData,
  ParticipationRecord,
} from './participation.js';

// Player stats types
export type {
  LoadPlayerStatsOptions,
  PlayerStatsData,
  PlayerStatsRecord,
  SummaryLevel,
} from './player-stats.js';
