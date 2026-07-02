/**
 * FTN charting data type definitions
 * @module types/ftncharting
 *
 * Data Attribution:
 * - Source: FTN Data via nflverse
 * - License: CC-BY-SA 4.0
 * - Required attribution: "FTN Data via nflverse"
 */

import type { GameId, Season, Timestamp, Week } from './common';

/**
 * FTN charting record
 * Manually charted play-level details (formations, pressure, ball placement,
 * QB decision making) from FTN Data, keyed to nflverse play-by-play.
 *
 * Data Attribution:
 * - Source: FTN Data via nflverse
 * - License: CC-BY-SA 4.0
 * - Required attribution: "FTN Data via nflverse"
 */
export interface FtnChartingRecord {
  // ===== IDENTIFIERS =====
  /** FTN game identifier */
  ftn_game_id: number;
  /** nflverse game identifier (format: season_week_away_home) - join key to PBP */
  nflverse_game_id: GameId;
  /** Season year */
  season: Season;
  /** Week number */
  week: Week;
  /** FTN play identifier */
  ftn_play_id: number;
  /** nflverse play identifier within the game - join key to PBP */
  nflverse_play_id: number;

  // ===== PRE-SNAP =====
  /** Hash mark the play started from (L/M/R; 0 when not charted) */
  starting_hash: string | number | null;
  /** QB alignment at snap (e.g., S = shotgun, U = under center; 0 when not charted) */
  qb_location: string | number | null;
  /** Number of offensive players in the backfield */
  n_offense_backfield: number | null;
  /** Number of defenders in the box */
  n_defense_box: number | null;
  /** Whether the offense went no-huddle */
  is_no_huddle: boolean | null;
  /** Whether the offense used pre-snap motion */
  is_motion: boolean | null;

  // ===== PLAY DESIGN =====
  /** Whether the play used play action */
  is_play_action: boolean | null;
  /** Whether the pass was a screen */
  is_screen_pass: boolean | null;
  /** Whether the play was a run-pass option */
  is_rpo: boolean | null;
  /** Whether the play was a trick play */
  is_trick_play: boolean | null;
  /** Whether the play was a QB sneak */
  is_qb_sneak: boolean | null;

  // ===== QB / PASS CHARTING =====
  /** Whether the QB left the pocket */
  is_qb_out_of_pocket: boolean | null;
  /** Whether the throw was interception-worthy */
  is_interception_worthy: boolean | null;
  /** Whether the pass was a throwaway */
  is_throw_away: boolean | null;
  /** Which read in the progression was thrown (e.g., 1, 2, CHK for checkdown) */
  read_thrown: string | number | null;
  /** Whether the ball was catchable */
  is_catchable_ball: boolean | null;
  /** Whether the catch was contested */
  is_contested_ball: boolean | null;
  /** Whether the receiver created the reception */
  is_created_reception: boolean | null;
  /** Whether the pass was dropped */
  is_drop: boolean | null;

  // ===== PASS RUSH =====
  /** Number of blitzers */
  n_blitzers: number | null;
  /** Number of pass rushers */
  n_pass_rushers: number | null;
  /** Whether a sack was charged to the QB */
  is_qb_fault_sack: boolean | null;

  // ===== METADATA =====
  /** Timestamp when FTN delivered the data (ISO 8601) */
  date_pulled: Timestamp | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields as the dataset evolves */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Array of FTN charting records
 */
export type FtnChartingData = FtnChartingRecord[];

/**
 * Options for loading FTN charting data
 */
export interface LoadFtnChartingOptions {
  /** File format to load. Defaults to 'parquet'; pass 'csv' if you need it. */
  format?: 'csv' | 'parquet';
}
