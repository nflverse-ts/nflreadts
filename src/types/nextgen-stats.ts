/**
 * Next Gen Stats type definitions
 * @module types/nextgen-stats
 */

import type { Season, SeasonType, TeamAbbr, Week } from './common.js';
import type { NgsStatType } from '../utils/url.js';

/**
 * Next Gen Stats record
 *
 * One row per player per week (and per season aggregate). The metric columns
 * present depend on the requested stat type ('passing', 'receiving', or
 * 'rushing'); metrics for other stat types are absent from the file.
 *
 * Note: the weekly NGS files include `week: 0` rows, which are the
 * season-aggregate totals for that player. Filter `week > 0` if you only want
 * true weekly rows.
 *
 * Data Attribution: NFL Next Gen Stats via nflverse
 *
 * @see https://nflreadr.nflverse.com/articles/dictionary_nextgen_stats.html
 */
export interface NextgenStatsRecord {
  // ===== IDENTIFIERS (all stat types) =====
  /** Season year */
  season: Season;
  /** Season type (REG or POST) */
  season_type: SeasonType;
  /** Week number. 0 indicates the season-aggregate row */
  week: Week;
  /** Player display name */
  player_display_name: string;
  /** Player position */
  player_position: string;
  /** Team abbreviation */
  team_abbr: TeamAbbr;
  /** Player GSIS identifier */
  player_gsis_id: string | null;
  /** Player first name */
  player_first_name: string | null;
  /** Player last name */
  player_last_name: string | null;
  /** Player jersey number */
  player_jersey_number: number | null;
  /** Player short name (e.g. "P.Mahomes") */
  player_short_name: string | null;

  // ===== PASSING METRICS (statType: 'passing') =====
  /** Average time to throw (seconds) */
  avg_time_to_throw?: number | null;
  /** Average completed air yards */
  avg_completed_air_yards?: number | null;
  /** Average intended air yards (also present for receiving) */
  avg_intended_air_yards?: number | null;
  /** Average air yards differential */
  avg_air_yards_differential?: number | null;
  /** Aggressiveness (% of throws into tight coverage) */
  aggressiveness?: number | null;
  /** Longest completed air distance */
  max_completed_air_distance?: number | null;
  /** Average air yards to the sticks */
  avg_air_yards_to_sticks?: number | null;
  /** Pass attempts */
  attempts?: number | null;
  /** Passing yards */
  pass_yards?: number | null;
  /** Passing touchdowns */
  pass_touchdowns?: number | null;
  /** Interceptions thrown */
  interceptions?: number | null;
  /** Passer rating */
  passer_rating?: number | null;
  /** Completions */
  completions?: number | null;
  /** Completion percentage */
  completion_percentage?: number | null;
  /** Expected completion percentage */
  expected_completion_percentage?: number | null;
  /** Completion percentage above expectation (CPOE) */
  completion_percentage_above_expectation?: number | null;
  /** Average air distance */
  avg_air_distance?: number | null;
  /** Maximum air distance */
  max_air_distance?: number | null;

  // ===== RECEIVING METRICS (statType: 'receiving') =====
  /** Average cushion at snap (yards) */
  avg_cushion?: number | null;
  /** Average separation at catch (yards) */
  avg_separation?: number | null;
  /** Share of team intended air yards (%) */
  percent_share_of_intended_air_yards?: number | null;
  /** Receptions */
  receptions?: number | null;
  /** Targets */
  targets?: number | null;
  /** Catch percentage */
  catch_percentage?: number | null;
  /** Receiving yards */
  yards?: number | null;
  /** Receiving touchdowns */
  rec_touchdowns?: number | null;
  /** Average yards after catch */
  avg_yac?: number | null;
  /** Average expected yards after catch */
  avg_expected_yac?: number | null;
  /** Average yards after catch above expectation */
  avg_yac_above_expectation?: number | null;

  // ===== RUSHING METRICS (statType: 'rushing') =====
  /** Rushing efficiency */
  efficiency?: number | null;
  /** Percent of attempts against 8+ defenders in the box */
  percent_attempts_gte_eight_defenders?: number | null;
  /** Average time behind the line of scrimmage (seconds) */
  avg_time_to_los?: number | null;
  /** Rush attempts */
  rush_attempts?: number | null;
  /** Rushing yards */
  rush_yards?: number | null;
  /** Average rush yards per attempt */
  avg_rush_yards?: number | null;
  /** Rushing touchdowns */
  rush_touchdowns?: number | null;
  /** Expected rush yards */
  expected_rush_yards?: number | null;
  /** Rush yards over expected */
  rush_yards_over_expected?: number | null;
  /** Rush yards over expected per attempt */
  rush_yards_over_expected_per_att?: number | null;
  /** Rush percentage over expected */
  rush_pct_over_expected?: number | null;

  /** Allow additional columns nflverse may add over time */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading Next Gen Stats
 *
 * Note: Next Gen Stats are published as parquet only (no plain `.csv` asset
 * exists in the nflverse-data release), so there is no format option.
 */
export interface LoadNextgenStatsOptions {
  /**
   * Stat category to load
   * @default 'passing'
   */
  statType?: NgsStatType;
}
