/**
 * NFL Combine data types
 * @module types/combine
 */

import type { Season } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Combine record representing a single player's NFL Scouting Combine results
 *
 * This interface matches the nflreadr::load_combine() output structure.
 * Data is sourced from Pro Football Reference and covers 2000 to present.
 * Workout fields are null when a player skipped that drill.
 *
 * @see https://nflreadr.nflverse.com/reference/load_combine.html
 */
export interface CombineRecord {
  /**
   * Combine year
   */
  season: Season;

  /**
   * Year the player was drafted (null if undrafted)
   */
  draft_year: number | null;

  /**
   * Full name of the drafting team (null if undrafted)
   * @example "New York Jets"
   */
  draft_team: string | null;

  /**
   * Round the player was drafted in (null if undrafted)
   */
  draft_round: number | null;

  /**
   * Overall draft pick number (null if undrafted)
   */
  draft_ovr: number | null;

  /**
   * Pro Football Reference player ID
   */
  pfr_id: string | null;

  /**
   * College Football Reference player ID
   */
  cfb_id: string | null;

  /**
   * Player's full name
   */
  player_name: string;

  /**
   * Position the player worked out at
   */
  pos: string;

  /**
   * College the player attended
   */
  school: string | null;

  /**
   * Height in feet-inches notation
   * @example "6-4"
   */
  ht: string | null;

  /**
   * Weight in pounds
   */
  wt: number | null;

  /**
   * 40-yard dash time in seconds
   */
  forty: number | null;

  /**
   * Bench press reps at 225 lbs
   */
  bench: number | null;

  /**
   * Vertical jump in inches
   */
  vertical: number | null;

  /**
   * Broad jump in inches
   */
  broad_jump: number | null;

  /**
   * Three-cone drill time in seconds
   */
  cone: number | null;

  /**
   * 20-yard shuttle time in seconds
   */
  shuttle: number | null;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading combine data
 */
export interface LoadCombineOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
