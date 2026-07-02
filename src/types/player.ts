/**
 * Player data type definitions
 * @module types/player
 */

import type { DateString, Position, Season, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Comprehensive player database record
 *
 * Matches the nflverse "players v2" release schema (nflreadr >= 1.5.0) - the
 * single source of truth for NFL player IDs and biographical information
 * across various data sources.
 *
 * @see https://nflreadr.nflverse.com/reference/load_players.html
 */
export interface PlayerRecord {
  // ===== NAMES =====
  /** GSIS ID - primary nflverse player identifier */
  gsis_id: string;
  /** Full display name (e.g., "Patrick Mahomes") */
  display_name: string;
  /** Commonly used first name (may differ from legal first name) */
  common_first_name: string | null;
  /** First name */
  first_name: string | null;
  /** Last name */
  last_name: string | null;
  /** Abbreviated name (e.g., "P.Mahomes") */
  short_name: string | null;
  /** Name used on the field/broadcasts */
  football_name: string | null;
  /** Name suffix (e.g., "Jr.", "III") */
  suffix: string | null;

  // ===== EXTERNAL IDS =====
  /** Elias Sports Bureau ID */
  esb_id: string | null;
  /** NFL.com player ID */
  nfl_id: number | null;
  /** Pro Football Reference ID */
  pfr_id: string | null;
  /** Pro Football Focus ID */
  pff_id: number | null;
  /** Over The Cap ID */
  otc_id: number | null;
  /** ESPN player ID */
  espn_id: number | null;
  /** NFL smart ID (UUID-style identifier derived from the ESB ID) */
  smart_id: string | null;

  // ===== BIOGRAPHICAL =====
  /** Birth date (YYYY-MM-DD) */
  birth_date: DateString | null;
  /** Position group (QB, RB, WR, OL, DL, LB, DB, SPEC, etc.) */
  position_group: string | null;
  /** Position as listed by the NFL */
  position: Position | null;
  /** Next Gen Stats position group */
  ngs_position_group: string | null;
  /** Next Gen Stats position */
  ngs_position: string | null;
  /** Height in inches */
  height: number | null;
  /** Weight in pounds */
  weight: number | null;
  /** Headshot image URL */
  headshot: string | null;
  /** College attended (usually the last one) */
  college_name: string | null;
  /** College conference */
  college_conference: string | null;

  // ===== CAREER =====
  /** Jersey number */
  jersey_number: number | null;
  /** First NFL season */
  rookie_season: Season | null;
  /** Most recent NFL season */
  last_season: Season | null;
  /** Most recent team */
  latest_team: TeamAbbr | null;
  /** Roster status (e.g., ACT, RES, CUT, DEV, RET) */
  status: string | null;
  /** Next Gen Stats roster status code */
  ngs_status: string | null;
  /** Next Gen Stats roster status description (e.g., "Active", "R/Injured") */
  ngs_status_short_description: string | null;
  /** Years of NFL experience */
  years_of_experience: number | null;
  /** PFF position designation */
  pff_position: string | null;
  /** PFF roster status */
  pff_status: string | null;

  // ===== DRAFT =====
  /** Draft year */
  draft_year: Season | null;
  /** Draft round */
  draft_round: number | null;
  /** Overall draft pick number */
  draft_pick: number | null;
  /** Team that drafted the player */
  draft_team: TeamAbbr | null;
}

/**
 * Options for loading player data
 */
export interface LoadPlayersOptions extends LoadOptions {
  /**
   * Data format - 'csv' or 'parquet'
   * @default 'parquet'
   */
  format?: 'csv' | 'parquet';
}
