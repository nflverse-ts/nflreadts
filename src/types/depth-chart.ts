/**
 * Depth chart type definitions
 * @module types/depth-chart
 */

import type { TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Depth chart record
 *
 * Contains weekly depth chart information for each team.
 * Data available back to 2001.
 *
 * Note: Data structure changed after 2024 season. This represents
 * the current schema (2025+).
 *
 * @see https://nflreadr.nflverse.com/articles/dictionary_depth_charts.html
 */
export interface DepthChartRecord {
  /**
   * Timestamp when data was loaded (ISO8601 format)
   */
  dt: string;

  /**
   * Team abbreviation
   */
  team: TeamAbbr;

  /**
   * Player's full name
   */
  player_name: string;

  /**
   * ESPN player ID
   */
  espn_id: string | null;

  /**
   * GSIS ID (primary play-by-play identifier)
   */
  gsis_id: string | null;

  /**
   * Position group identifier code
   */
  pos_grp_id: string;

  /**
   * Position group (formation type)
   * Examples: "OFFENSE", "DEFENSE", "SPECIAL_TEAMS"
   */
  pos_grp: string;

  /**
   * Position identifier code
   */
  pos_id: string;

  /**
   * Position name designation
   * Examples: "Quarterback", "Running Back", "Wide Receiver"
   */
  pos_name: string;

  /**
   * Position abbreviation
   * Examples: "QB", "RB", "WR"
   */
  pos_abb: string;

  /**
   * Position slot number in formation
   */
  pos_slot: number;

  /**
   * Player's rank on depth chart for this position slot
   * 1 = starter, 2 = backup, etc.
   */
  pos_rank: number;
}

/**
 * Options for loading depth chart data
 */
export interface LoadDepthChartsOptions extends LoadOptions {
  /**
   * Data format - 'csv' or 'parquet'
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
