/**
 * Snap count data type definitions
 * @module types/snapcounts
 */

import type { GameId, GameType, Season, TeamAbbr, Week } from './common';

/**
 * Snap count record
 * One row per player per game with offensive, defensive, and special teams
 * snap totals and percentages. Sourced from Pro Football Reference via the
 * nflverse `snap_counts` release.
 */
export interface SnapCountRecord {
  // ===== IDENTIFIERS =====
  /** nflverse game identifier (format: season_week_away_home) */
  game_id: GameId;
  /** Pro Football Reference game identifier */
  pfr_game_id: string | null;
  /** Season year */
  season: Season;
  /** Game type (REG/POST) */
  game_type: GameType | null;
  /** Week number */
  week: Week;

  // ===== PLAYER INFO =====
  /** Player name */
  player: string | null;
  /** Pro Football Reference player ID */
  pfr_player_id: string | null;
  /** Position as listed by Pro Football Reference */
  position: string | null;
  /** Player's team abbreviation */
  team: TeamAbbr;
  /** Opposing team abbreviation */
  opponent: TeamAbbr | null;

  // ===== SNAP COUNTS =====
  /** Offensive snaps played */
  offense_snaps: number | null;
  /** Share of team offensive snaps (0-1) */
  offense_pct: number | null;
  /** Defensive snaps played */
  defense_snaps: number | null;
  /** Share of team defensive snaps (0-1) */
  defense_pct: number | null;
  /** Special teams snaps played */
  st_snaps: number | null;
  /** Share of team special teams snaps (0-1) */
  st_pct: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields as the dataset evolves */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Array of snap count records
 */
export type SnapCountData = SnapCountRecord[];

/**
 * Options for loading snap count data
 */
export interface LoadSnapCountsOptions {
  /** File format to load. Defaults to 'parquet'; pass 'csv' if you need it. */
  format?: 'csv' | 'parquet';
}
