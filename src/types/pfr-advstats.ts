/**
 * Pro Football Reference advanced stats type definitions
 * @module types/pfr-advstats
 */

import type { GameId, Season, TeamAbbr, Week } from './common.js';
import type { PfrStatType, PfrSummaryLevel } from '../utils/url.js';

/**
 * Pro Football Reference advanced stats record
 *
 * Columns vary by stat type ('pass', 'rush', 'rec', 'def') AND by summary
 * level: week-level files are keyed by game, season-level files are keyed by
 * player-season and use different column names (e.g. `pfr_id`/`tm` instead of
 * `pfr_player_id`/`team`). Only `season` is present in every file; the fields
 * documented below are the identifying columns of each level, and the metric
 * columns come through the index signature.
 *
 * Data Attribution: Pro Football Reference via nflverse
 *
 * @see https://nflreadr.nflverse.com/reference/load_pfr_advstats.html
 */
export interface PfrAdvstatsRecord {
  /** Season year (present at both summary levels) */
  season: Season;

  // ===== WEEK-LEVEL IDENTIFIERS (summaryLevel: 'week') =====
  /** nflverse game identifier */
  game_id?: GameId | null;
  /** Pro Football Reference game identifier */
  pfr_game_id?: string | null;
  /** Week number */
  week?: Week | null;
  /** Game type (REG, WC, DIV, CON, SB) */
  game_type?: string | null;
  /** Player team abbreviation */
  team?: TeamAbbr | null;
  /** Opponent team abbreviation */
  opponent?: TeamAbbr | null;
  /** Player name as listed by PFR */
  pfr_player_name?: string | null;
  /** Pro Football Reference player identifier */
  pfr_player_id?: string | null;

  // ===== SEASON-LEVEL IDENTIFIERS (summaryLevel: 'season') =====
  /** Player name */
  player?: string | null;
  /** Pro Football Reference player identifier */
  pfr_id?: string | null;
  /** Team abbreviation (defense file) */
  tm?: TeamAbbr | null;
  /** Player age (defense file) */
  age?: number | null;
  /** Position (defense file) */
  pos?: string | null;
  /** Games played (defense file) */
  g?: number | null;
  /** Games started (defense file) */
  gs?: number | null;

  /**
   * Metric columns (drops, pressures, broken tackles, coverage stats, etc.)
   * vary by stat type and summary level
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading PFR advanced stats
 */
export interface LoadPfrAdvstatsOptions {
  /**
   * Stat category to load
   * @default 'pass'
   */
  statType?: PfrStatType;

  /**
   * Summary level: 'week' fetches one file per requested season,
   * 'season' fetches a single all-seasons file and filters
   * @default 'week'
   */
  summaryLevel?: PfrSummaryLevel;

  /**
   * File format to use
   * Defaults to 'parquet'; pass 'csv' if you need it.
   * @default 'parquet'
   */
  format?: 'csv' | 'parquet';
}
