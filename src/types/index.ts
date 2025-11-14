/**
 * Type definitions for nflreadts
 * @module types
 */

// ============================================================================
// RECORD TYPES - What data loading functions return
// ============================================================================

export type { DepthChartRecord } from './depth-chart.js';
export type { ParticipationRecord } from './participation.js';
export type { PlayByPlayRecord } from './pbp.js';
export type { PlayerStatsRecord } from './player-stats.js';
export type { PlayerRecord } from './player.js';
export type { RosterRecord } from './roster.js';
export type { ScheduleRecord } from './schedule.js';
export type { TeamRecord } from './team.js';

// ============================================================================
// OPTIONS TYPES - Parameters for data loading functions
// ============================================================================

export type { LoadDepthChartsOptions } from './depth-chart.js';
export type { LoadParticipationOptions } from './participation.js';
export type { LoadPbpOptions } from './pbp.js';
export type { LoadPlayerStatsOptions } from './player-stats.js';
export type { LoadPlayersOptions } from './player.js';
export type { LoadRostersOptions } from './roster.js';
export type { LoadSchedulesOptions } from './schedule.js';
export type { LoadTeamsOptions } from './team.js';
export type { LoadOptions } from './utils.js';

// ============================================================================
// COMMON TYPES - Used in record types and parameters
// ============================================================================

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
} from './common.js';

// ============================================================================
// ERROR TYPES - For error handling
// ============================================================================

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

// ============================================================================
// RESULT TYPE - Functional error handling
// ============================================================================

export type { Result } from './error.js';
export { Err, Ok, isErr, isOk, mapError, mapResult, unwrap, unwrapOr } from './error.js';
