/**
 * Type definitions for nflreadts
 * @module types
 */

// ============================================================================
// RECORD TYPES - What data loading functions return
// ============================================================================

export type { CombineRecord } from './combine.js';
export type { ContractRecord, ContractSeasonDetail } from './contracts.js';
export type { DepthChartRecord } from './depth-chart.js';
export type { DraftPickRecord } from './draft-picks.js';
export type { FfOpportunityRecord } from './ff-opportunity.js';
export type { FfPlayeridsRecord } from './ff-playerids.js';
export type { FfRankingsRecord } from './ff-rankings.js';
export type { FtnChartingRecord } from './ftn-charting.js';
export type { InjuryRecord } from './injuries.js';
export type { NextgenStatsRecord } from './nextgen-stats.js';
export type { OfficialRecord } from './officials.js';
export type { ParticipationRecord } from './participation.js';
export type { PlayByPlayRecord } from './pbp.js';
export type { PfrAdvstatsRecord } from './pfr-advstats.js';
export type { PlayerStatsRecord } from './player-stats.js';
export type { PlayerRecord } from './player.js';
export type { RosterRecord } from './roster.js';
export type { WeeklyRosterRecord } from './rosters-weekly.js';
export type { ScheduleRecord } from './schedule.js';
export type { SnapCountRecord } from './snap-counts.js';
export type { TeamStatsRecord } from './team-stats.js';
export type { TeamRecord } from './team.js';
export type { TradeRecord } from './trades.js';

// ============================================================================
// OPTIONS TYPES - Parameters for data loading functions
// ============================================================================

export type { LoadCombineOptions } from './combine.js';
export type { LoadContractsOptions } from './contracts.js';
export type { LoadDepthChartsOptions } from './depth-chart.js';
export type { LoadDraftPicksOptions } from './draft-picks.js';
export type {
  FfOpportunityModelVersion,
  FfOpportunityStatType,
  LoadFfOpportunityOptions,
} from './ff-opportunity.js';
export type { FfRankingsType } from './ff-rankings.js';
export type { LoadFtnChartingOptions } from './ftn-charting.js';
export type { LoadInjuriesOptions } from './injuries.js';
export type { LoadNextgenStatsOptions } from './nextgen-stats.js';
export type { LoadOfficialsOptions } from './officials.js';
export type { LoadParticipationOptions } from './participation.js';
export type { LoadPbpOptions } from './pbp.js';
export type { LoadPfrAdvstatsOptions } from './pfr-advstats.js';
export type { LoadPlayerStatsOptions, SummaryLevel } from './player-stats.js';
export type { LoadPlayersOptions } from './player.js';
export type { LoadRostersOptions } from './roster.js';
export type { LoadRostersWeeklyOptions } from './rosters-weekly.js';
export type { LoadSchedulesOptions } from './schedule.js';
export type { LoadSnapCountsOptions } from './snap-counts.js';
export type { LoadTeamStatsOptions } from './team-stats.js';
export type { LoadTeamsOptions } from './team.js';
export type { LoadTradesOptions } from './trades.js';
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
