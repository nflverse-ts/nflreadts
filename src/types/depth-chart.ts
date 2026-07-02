/**
 * Depth chart type definitions
 * @module types/depth-chart
 */

import type { GameType, PlayerId, Season, TeamAbbr, Week } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Date-level depth chart record (2025 and later)
 *
 * Since the 2025 season, depth charts are sourced from ESPN and published as
 * dated snapshots (including preseason and offseason) instead of weekly rows.
 * Each snapshot lists every position slot in a formation grouping with a
 * ranked player.
 */
export interface DepthChartDatedRecord {
  /**
   * Snapshot timestamp (ISO8601, e.g. "2025-09-04T07:30:00Z").
   * The CSV parser hydrates this to a Date at runtime.
   */
  dt: string;

  /** Team abbreviation */
  team: TeamAbbr;

  /** Player's full name as listed by ESPN */
  player_name: string;

  /** ESPN player ID (string in parquet, number via CSV dynamic typing) */
  espn_id: string | number | null;

  /** GSIS ID (primary nflverse player identifier) */
  gsis_id: PlayerId | null;

  /** ESPN position group identifier (string in parquet, number via CSV dynamic typing) */
  pos_grp_id: string | number;

  /**
   * Position group / formation label
   * Examples: "3WR 1TE", "Base 3-4 D", "Base 4-3 D", "Special Teams"
   */
  pos_grp: string;

  /** ESPN position identifier within the group (string in parquet, number via CSV dynamic typing) */
  pos_id: string | number;

  /**
   * Position name
   * Examples: "Quarterback", "Left Defensive End", "Nickel Back"
   */
  pos_name: string;

  /**
   * Position abbreviation
   * Examples: "QB", "LDE", "NB"
   */
  pos_abb: string;

  /** Slot number of the position within the formation grouping */
  pos_slot: number;

  /**
   * Player's rank at the position slot
   * 1 = starter, 2 = backup, etc.
   */
  pos_rank: number;
}

/**
 * Weekly depth chart record (2001 through 2024)
 *
 * Team-submitted weekly depth charts from the legacy NFL source.
 */
export interface DepthChartWeeklyRecord {
  /** Season year */
  season: Season;

  /** Team abbreviation */
  club_code: TeamAbbr;

  /** Week number the depth chart applies to */
  week: Week;

  /** Game type (REG, POST) */
  game_type: GameType;

  /**
   * Depth chart rank (1 = starter, 2 = backup, etc.)
   * String in parquet, number via CSV dynamic typing.
   */
  depth_team: string | number;

  /** Player's last name */
  last_name: string;

  /** Player's first name */
  first_name: string;

  /** Name the player goes by on the field */
  football_name: string | null;

  /**
   * Formation grouping
   * Examples: "Offense", "Defense", "Special Teams"
   */
  formation: string;

  /** GSIS ID (primary nflverse player identifier) */
  gsis_id: PlayerId | null;

  /** Jersey number (string in parquet, number via CSV dynamic typing) */
  jersey_number: string | number | null;

  /**
   * Roster position abbreviation
   * Examples: "QB", "G", "ILB"
   */
  position: string;

  /** Elias Sports Bureau player ID */
  elias_id: string | null;

  /**
   * Position on the depth chart
   * Examples: "RG", "NB", "H"
   */
  depth_position: string;

  /** Player's full name */
  full_name: string;
}

/**
 * Depth chart record
 *
 * The nflverse depth_charts release ships two schemas depending on season:
 * - 2001-2024: weekly team-submitted depth charts ({@link DepthChartWeeklyRecord})
 * - 2025+: date-level ESPN snapshots ({@link DepthChartDatedRecord})
 *
 * Narrow with the `dt` field: `'dt' in record` is true only for date-level records.
 *
 * @see https://nflreadr.nflverse.com/articles/dictionary_depth_charts.html
 */
export type DepthChartRecord = DepthChartDatedRecord | DepthChartWeeklyRecord;

/**
 * Options for loading depth chart data
 */
export interface LoadDepthChartsOptions extends LoadOptions {
  /**
   * Data format - 'csv' or 'parquet'
   * @default 'parquet'
   */
  format?: 'csv' | 'parquet';
}
