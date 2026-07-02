/**
 * Injury report data type definitions
 * @module types/injuries
 */

import type { GameType, PlayerId, Season, TeamAbbr, Timestamp, Week } from './common';

/**
 * Injury report record
 * One row per player per official injury report entry.
 * Matches the nflverse `injuries` release schema.
 */
export interface InjuryRecord {
  // ===== IDENTIFIERS =====
  /** Season year */
  season: Season;
  /** Game type for the report week (REG/POST/PRE) */
  game_type: GameType | null;
  /** Team abbreviation */
  team: TeamAbbr;
  /** Week number of the injury report */
  week: Week;
  /** Player's GSIS ID - use this to join to other nflverse sources */
  gsis_id: PlayerId | null;

  // ===== PLAYER INFO =====
  /** Position as listed by the NFL */
  position: string | null;
  /** Full player name */
  full_name: string | null;
  /** First name */
  first_name: string | null;
  /** Last name */
  last_name: string | null;

  // ===== GAME STATUS REPORT =====
  /** Primary injury listed on the official game status report */
  report_primary_injury: string | null;
  /** Secondary injury listed on the official game status report */
  report_secondary_injury: string | null;
  /** Game status (e.g., Out, Doubtful, Questionable) */
  report_status: string | null;

  // ===== PRACTICE REPORT =====
  /** Primary injury listed on the practice report */
  practice_primary_injury: string | null;
  /** Secondary injury listed on the practice report */
  practice_secondary_injury: string | null;
  /** Practice participation (e.g., Full Participation in Practice) */
  practice_status: string | null;

  // ===== METADATA =====
  /** Timestamp when the report entry was last modified (ISO 8601) */
  date_modified: Timestamp | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields as the dataset evolves */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Array of injury records
 */
export type InjuryData = InjuryRecord[];

/**
 * Options for loading injury data
 */
export interface LoadInjuriesOptions {
  /** File format to load. Defaults to 'parquet'; pass 'csv' if you need it. */
  format?: 'csv' | 'parquet';
}
