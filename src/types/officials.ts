/**
 * Game officials data types
 * @module types/officials
 */

import type { Season, Week } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Official record representing one official's assignment to one game
 *
 * This interface matches the nflreadr::load_officials() output structure.
 * Data covers 2015 to present, with one row per official per game.
 *
 * @see https://nflreadr.nflverse.com/reference/load_officials.html
 */
export interface OfficialRecord {
  /**
   * Numeric NFL game identifier
   * @example 2015091000
   */
  game_id: number;

  /**
   * NFL game key
   */
  game_key: number;

  /**
   * Official's full name
   */
  official_name: string;

  /**
   * Officiating position
   * @example "Referee", "Field Judge", "Head Linesman"
   */
  position: string | null;

  /**
   * Official's jersey number
   */
  jersey_number: number | null;

  /**
   * Official's NFL identifier
   */
  official_id: number | null;

  /**
   * NFL season of the game
   */
  season: Season;

  /**
   * Season/game type
   * @example "REG", "WC", "DIV", "CON", "SB", "POST"
   */
  season_type: string;

  /**
   * Week number within the season
   */
  week: Week;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading officials data
 */
export interface LoadOfficialsOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
