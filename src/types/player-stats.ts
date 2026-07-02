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
 * Matches the nflverse `stats_player` release schema (nflfastR::calculate_stats),
 * which aims to match NFL official box scores and season summaries.
 *
 * Week/game fields (week, season_type, game_id, opponent_team) are only present
 * in week-level files; season-level files (reg, post, reg+post) omit them.
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
  /** Player headshot image URL */
  headshot_url: string | null;

  // ===== GAME INFO =====
  /** Season year */
  season: Season;
  /** Game week number (week-level files only) */
  week: Week | null;
  /** Season type (REG/POST; week-level files only) */
  season_type: string | null;
  /** Game identifier (week-level files only) */
  game_id: string | null;
  /** Player's team abbreviation */
  team: TeamAbbr;
  /** Opposing team abbreviation (week-level files only) */
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
  /** Fumbles on sacks */
  sack_fumbles: number | null;
  /** Fumbles lost on sacks */
  sack_fumbles_lost: number | null;
  /** Passing first downs */
  passing_first_downs: number | null;
  /** Passing two point conversion attempts */
  passing_2pt_conversions: number | null;
  /** Passing Air Conversion Ratio */
  pacr: number | null;

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
  /** Air yards share (receiving air yards / team air yards) */
  air_yards_share: number | null;
  /** Weighted Opportunity Rating */
  wopr: number | null;
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
  /** Assists on tackles */
  def_tackle_assists: number | null;
  /** Tackles for loss */
  def_tackles_for_loss: number | null;
  /** Tackles for loss yards */
  def_tackles_for_loss_yards: number | null;
  /** Fumbles forced */
  def_fumbles_forced: number | null;
  /** Sacks */
  def_sacks: number | null;
  /** Sack yards */
  def_sack_yards: number | null;
  /** Quarterback hits */
  def_qb_hits: number | null;
  /** Interceptions */
  def_interceptions: number | null;
  /** Interception yards */
  def_interception_yards: number | null;
  /** Passes defended */
  def_pass_defended: number | null;
  /** Defensive touchdowns */
  def_tds: number | null;
  /** Defensive fumbles */
  def_fumbles: number | null;
  /** Safeties */
  def_safeties: number | null;

  // ===== FUMBLE / MISC STATS =====
  /** Miscellaneous yards */
  misc_yards: number | null;
  /** Own fumbles recovered */
  fumble_recovery_own: number | null;
  /** Own fumble recovery yards */
  fumble_recovery_yards_own: number | null;
  /** Opponent fumbles recovered */
  fumble_recovery_opp: number | null;
  /** Opponent fumble recovery yards */
  fumble_recovery_yards_opp: number | null;
  /** Fumble recovery touchdowns */
  fumble_recovery_tds: number | null;
  /** Penalties committed */
  penalties: number | null;
  /** Penalty yards */
  penalty_yards: number | null;

  // ===== RETURN STATS =====
  /** Punt returns */
  punt_returns: number | null;
  /** Punt return yards */
  punt_return_yards: number | null;
  /** Kickoff returns */
  kickoff_returns: number | null;
  /** Kickoff return yards */
  kickoff_return_yards: number | null;

  // ===== KICKING STATS =====
  /** Field goals made */
  fg_made: number | null;
  /** Field goal attempts */
  fg_att: number | null;
  /** Field goal misses */
  fg_missed: number | null;
  /** Field goals blocked */
  fg_blocked: number | null;
  /** Longest field goal made */
  fg_long: number | null;
  /** Field goal percentage */
  fg_pct: number | null;
  /** Field goals made from 0-19 yards */
  fg_made_0_19: number | null;
  /** Field goals made from 20-29 yards */
  fg_made_20_29: number | null;
  /** Field goals made from 30-39 yards */
  fg_made_30_39: number | null;
  /** Field goals made from 40-49 yards */
  fg_made_40_49: number | null;
  /** Field goals made from 50-59 yards */
  fg_made_50_59: number | null;
  /** Field goals made from 60+ yards */
  fg_made_60_: number | null;
  /** Field goals missed from 0-19 yards */
  fg_missed_0_19: number | null;
  /** Field goals missed from 20-29 yards */
  fg_missed_20_29: number | null;
  /** Field goals missed from 30-39 yards */
  fg_missed_30_39: number | null;
  /** Field goals missed from 40-49 yards */
  fg_missed_40_49: number | null;
  /** Field goals missed from 50-59 yards */
  fg_missed_50_59: number | null;
  /** Field goals missed from 60+ yards */
  fg_missed_60_: number | null;
  /** Distances of field goals made (semicolon-separated list) */
  fg_made_list: string | null;
  /** Distances of field goals missed (semicolon-separated list) */
  fg_missed_list: string | null;
  /** Distances of field goals blocked (semicolon-separated list) */
  fg_blocked_list: string | null;
  /** Total distance of field goals made */
  fg_made_distance: number | null;
  /** Total distance of field goals missed */
  fg_missed_distance: number | null;
  /** Total distance of field goals blocked */
  fg_blocked_distance: number | null;
  /** Extra points made */
  pat_made: number | null;
  /** Extra point attempts */
  pat_att: number | null;
  /** Extra point misses */
  pat_missed: number | null;
  /** Extra points blocked */
  pat_blocked: number | null;
  /** Extra point percentage */
  pat_pct: number | null;
  /** Game-winning field goals made */
  gwfg_made: number | null;
  /** Game-winning field goal attempts */
  gwfg_att: number | null;
  /** Game-winning field goals missed */
  gwfg_missed: number | null;
  /** Game-winning field goals blocked */
  gwfg_blocked: number | null;
  /** Game-winning field goal distance */
  gwfg_distance: number | null;

  // ===== SPECIAL TEAMS =====
  /** Special teams touchdowns */
  special_teams_tds: number | null;

  // ===== FANTASY STATS =====
  /** Standard fantasy points */
  fantasy_points: number | null;
  /** PPR (Point Per Reception) fantasy points */
  fantasy_points_ppr: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields as the dataset evolves */
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
  /** File format to load. Defaults to 'parquet'; pass 'csv' if you need it. */
  format?: 'csv' | 'parquet';
  /**
   * Summary level - selects which pre-aggregated nflverse file is downloaded:
   * - 'week': Week-by-week stats (default)
   * - 'reg': Regular season totals
   * - 'post': Postseason totals
   * - 'reg+post': Combined regular + postseason totals
   */
  summaryLevel?: SummaryLevel;
}
