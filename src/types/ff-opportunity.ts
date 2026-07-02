/**
 * Fantasy football expected points (ffopportunity) type definitions
 * @module types/ff-opportunity
 */

import type { GameId, Season, TeamAbbr, Week } from './common.js';

/**
 * Stat file to load
 * - 'weekly': player-week expected fantasy points summary
 * - 'pbp_pass': play-level expected points for pass plays
 * - 'pbp_rush': play-level expected points for rush plays
 */
export type FfOpportunityStatType = 'weekly' | 'pbp_pass' | 'pbp_rush';

/**
 * Expected points model version published by ffverse/ffopportunity
 */
export type FfOpportunityModelVersion = 'latest' | 'v1.0.0';

/**
 * Fantasy football opportunity record (ffverse/ffopportunity expected points)
 *
 * The documented fields below are the identifiers of the 'weekly' files,
 * which carry ~200 metric columns following the pattern
 * `{pass|rec|rush|total}_{stat}`, `{stat}_exp` (expected), `{stat}_diff`
 * (actual minus expected), and `_team` suffixed team totals; all of them are
 * available through the index signature. The 'pbp_pass' and 'pbp_rush' files
 * are play-level with entirely different columns (`play_id`, `desc`,
 * `passer_player_id`, etc.), also via the index signature.
 *
 * Data Attribution: ffverse/ffopportunity
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_opportunity.html
 */
export interface FfOpportunityRecord {
  /** Season year */
  season: Season;
  /** Week number */
  week: Week;
  /** nflverse game identifier */
  game_id: GameId | null;
  /** Possession team abbreviation */
  posteam: TeamAbbr | null;
  /** Player GSIS identifier ('weekly' files) */
  player_id?: string | null;
  /** Player full name ('weekly' files) */
  full_name?: string | null;
  /** Player position ('weekly' files) */
  position?: string | null;
  /** Total expected fantasy points ('weekly' files) */
  total_fantasy_points_exp?: number | null;
  /** Total actual fantasy points ('weekly' files) */
  total_fantasy_points?: number | null;

  /** Expected/actual/diff metric columns; play-level columns for pbp files */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading ffopportunity expected points data
 */
export interface LoadFfOpportunityOptions {
  /**
   * Stat file to load
   * @default 'weekly'
   */
  statType?: FfOpportunityStatType;

  /**
   * Expected points model version (GitHub release tag prefix)
   * @default 'latest'
   */
  modelVersion?: FfOpportunityModelVersion;

  /**
   * File format to use (both are published; nflreadpy fetches parquet)
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
