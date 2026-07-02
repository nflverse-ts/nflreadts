/**
 * Weekly roster data type definitions
 * @module types/rostersweekly
 */

import type { DateString, GameType, PlayerId, Season, TeamAbbr, Week } from './common';

/**
 * Weekly roster record
 * One row per player per team per week, reflecting the roster as of that week.
 * Matches the nflverse `weekly_rosters` release schema.
 */
export interface WeeklyRosterRecord {
  // ===== IDENTIFIERS =====
  /** Season year */
  season: Season;
  /** Team abbreviation */
  team: TeamAbbr;
  /** Week number the roster snapshot applies to */
  week: Week;
  /** Game type for the given week (REG/POST/PRE) */
  game_type: GameType | null;

  // ===== PLAYER INFO =====
  /** Position as listed by the NFL */
  position: string | null;
  /** Position on the team depth chart */
  depth_chart_position: string | null;
  /** Jersey number */
  jersey_number: number | null;
  /** Roster status code (e.g., ACT, RES, DEV) */
  status: string | null;
  /** Detailed roster status abbreviation (e.g., A01, P07) */
  status_description_abbr: string | null;
  /** Full player name */
  full_name: string | null;
  /** First name */
  first_name: string | null;
  /** Last name */
  last_name: string | null;
  /** Name the player goes by on the field */
  football_name: string | null;
  /** Birth date (YYYY-MM-DD) */
  birth_date: DateString | null;
  /** Height in inches */
  height: number | null;
  /** Weight in pounds */
  weight: number | null;
  /** College attended */
  college: string | null;
  /** Seasons of NFL experience */
  years_exp: number | null;
  /** Player headshot image URL */
  headshot_url: string | null;
  /** Position assigned by Next Gen Stats */
  ngs_position: string | null;

  // ===== CROSS-SOURCE IDS =====
  /** Player's GSIS ID - use this to join to other nflverse sources */
  gsis_id: PlayerId | null;
  /** ESPN player ID */
  espn_id: number | null;
  /** Sportradar player ID */
  sportradar_id: string | null;
  /** Yahoo player ID */
  yahoo_id: number | null;
  /** Rotowire player ID */
  rotowire_id: number | null;
  /** Pro Football Focus player ID */
  pff_id: number | null;
  /** Pro Football Reference player ID */
  pfr_id: string | null;
  /** FantasyData player ID */
  fantasy_data_id: number | null;
  /** Sleeper player ID */
  sleeper_id: number | null;
  /** Elias Sports Bureau ID */
  esb_id: string | null;
  /** GSIS integer ID */
  gsis_it_id: number | null;
  /** NFL smart ID */
  smart_id: string | null;

  // ===== DRAFT / ENTRY INFO =====
  /** Year the player entered the league */
  entry_year: number | null;
  /** Player's rookie season */
  rookie_year: number | null;
  /** Team that drafted the player */
  draft_club: string | null;
  /** Overall draft pick number */
  draft_number: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields as the dataset evolves */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Array of weekly roster records
 */
export type WeeklyRosterData = WeeklyRosterRecord[];

/**
 * Options for loading weekly roster data
 */
export interface LoadRostersWeeklyOptions {
  /** File format to load. Defaults to 'parquet'; pass 'csv' if you need it. */
  format?: 'csv' | 'parquet';
}
