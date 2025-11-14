/**
 * Player stats data type definitions
 * @module types/playerstats
 */

import type { PlayerId, Position, Season, TeamAbbr, Week } from './common';

/**
 * Summary level for aggregating player stats
 */
export type SummaryLevel = 'week' | 'reg' | 'post' | 'reg+post';

/**
 * Player statistics record
 * Contains comprehensive player performance statistics from NFL official box scores
 *
 * Note: This dataset aims to match NFL official box scores and season summaries.
 * The dataset includes 114+ columns covering all aspects of player performance.
 */
export interface PlayerStatsRecord {
  // ===== IDENTIFIERS =====
  /** Player's GSIS ID - use this to join to other sources */
  player_id: PlayerId;
  /** Abbreviated player name */
  player_name: string;
  /** Full player name from NFL data */
  player_display_name: string;
  /** Position of player as listed by NFL */
  position: Position | null;
  /** Position group (QB, RB, WR, TE, etc.) */
  position_group: string | null;

  // ===== GAME INFO =====
  /** Season year */
  season: Season;
  /** Game week number (null for season totals) */
  week: Week | null;
  /** Player's team abbreviation */
  team: TeamAbbr;
  /** Opposing team abbreviation */
  opponent_team: TeamAbbr | null;

  // ===== PASSING STATS =====
  /** Pass completions */
  completions: number | null;
  /** Pass attempts */
  attempts: number | null;
  /** Passing yards */
  passing_yards: number | null;
  /** Passing touchdowns */
  passing_tds: number | null;
  /** Interceptions thrown */
  passing_interceptions: number | null;
  /** Passing air yards */
  passing_air_yards: number | null;
  /** Passing yards after catch */
  passing_yards_after_catch: number | null;
  /** Passing EPA (Expected Points Added) */
  passing_epa: number | null;
  /** Completion percentage over expected (CPOE) */
  passing_cpoe: number | null;
  /** Times sacked */
  sacks_suffered: number | null;
  /** Sack yards lost */
  sack_yards_lost: number | null;
  /** Passing first downs */
  passing_first_downs: number | null;
  /** Passing two point conversion attempts */
  passing_2pt_conversions: number | null;

  // ===== RUSHING STATS =====
  /** Number of official rush attempts */
  carries: number | null;
  /** Rushing yards gained */
  rushing_yards: number | null;
  /** Rushing touchdowns */
  rushing_tds: number | null;
  /** Rushing fumbles */
  rushing_fumbles: number | null;
  /** Rushing fumbles lost */
  rushing_fumbles_lost: number | null;
  /** Rushing EPA */
  rushing_epa: number | null;
  /** Rushing first downs */
  rushing_first_downs: number | null;
  /** Rushing two point conversions */
  rushing_2pt_conversions: number | null;

  // ===== RECEIVING STATS =====
  /** Pass targets */
  targets: number | null;
  /** Receptions */
  receptions: number | null;
  /** Receiving yards */
  receiving_yards: number | null;
  /** Receiving touchdowns */
  receiving_tds: number | null;
  /** Receiving air yards */
  receiving_air_yards: number | null;
  /** Receiving yards after catch */
  receiving_yards_after_catch: number | null;
  /** Receiving EPA */
  receiving_epa: number | null;
  /** Receiver Air Conversion Ratio */
  racr: number | null;
  /** Target share (targets / team pass attempts) */
  target_share: number | null;
  /** Receiving fumbles */
  receiving_fumbles: number | null;
  /** Receiving fumbles lost */
  receiving_fumbles_lost: number | null;
  /** Receiving first downs */
  receiving_first_downs: number | null;
  /** Receiving two point conversions */
  receiving_2pt_conversions: number | null;

  // ===== DEFENSIVE STATS =====
  /** Solo tackles */
  def_tackles_solo: number | null;
  /** Tackles with assists */
  def_tackles_with_assist: number | null;
  /** Combined tackles (solo + assists) */
  def_tackles_combined: number | null;
  /** Tackles for loss */
  def_tackles_for_loss: number | null;
  /** Sacks */
  def_sacks: number | null;
  /** Quarterback hits */
  def_qb_hits: number | null;
  /** Interceptions */
  def_interceptions: number | null;
  /** Interception yards */
  def_interception_yards: number | null;
  /** Interception touchdowns */
  def_interception_tds: number | null;
  /** Passes defended */
  def_pass_defended: number | null;
  /** Fumbles forced */
  def_fumbles_forced: number | null;
  /** Fumble recoveries */
  def_fumble_recoveries: number | null;
  /** Fumble recovery yards */
  def_fumble_recovery_yards: number | null;
  /** Fumble recovery touchdowns */
  def_fumble_recovery_tds: number | null;
  /** Safeties */
  def_safeties: number | null;

  // ===== KICKING STATS =====
  /** Field goals made */
  fg_made: number | null;
  /** Field goal attempts */
  fg_att: number | null;
  /** Field goal misses */
  fg_missed: number | null;
  /** Field goal percentage */
  fg_pct: number | null;
  /** Field goals blocked */
  fg_blocked: number | null;
  /** Field goals made from 0-19 yards */
  fg_made_0_19: number | null;
  /** Field goals made from 20-29 yards */
  fg_made_20_29: number | null;
  /** Field goals made from 30-39 yards */
  fg_made_30_39: number | null;
  /** Field goals made from 40-49 yards */
  fg_made_40_49: number | null;
  /** Field goals made from 50+ yards */
  fg_made_50_59: number | null;
  /** Field goals made from 60+ yards */
  fg_made_60_plus: number | null;
  /** Extra points made */
  pat_made: number | null;
  /** Extra point attempts */
  pat_att: number | null;
  /** Extra point misses */
  pat_missed: number | null;
  /** Extra points blocked */
  pat_blocked: number | null;

  // ===== FANTASY STATS =====
  /** Standard fantasy points */
  fantasy_points: number | null;
  /** PPR (Point Per Reception) fantasy points */
  fantasy_points_ppr: number | null;

  // ===== SPECIAL TEAMS =====
  /** Special teams tackles */
  special_teams_tds: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields from the 114+ column dataset */
  [key: string]: string | number | null | undefined;
}

/**
 * Array of player stats records
 */
export type PlayerStatsData = PlayerStatsRecord[];

/**
 * Options for loading player stats data
 */
export interface LoadPlayerStatsOptions {
  /** File format to load (csv or parquet) */
  format?: 'csv' | 'parquet';
  /**
   * Summary level for aggregation:
   * - 'week': Week-by-week stats (default)
   * - 'reg': Regular season totals
   * - 'post': Postseason totals
   * - 'reg+post': Combined regular + postseason totals
   */
  summaryLevel?: SummaryLevel;
}
