/**
 * Roster-related type definitions
 * @module types/roster
 */

import type { DateString, GameType, Season, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Roster status codes
 */
export type RosterStatus =
  | 'ACT' // Active
  | 'RES' // Reserve
  | 'IR' // Injured Reserve
  | 'PUP' // Physically Unable to Perform
  | 'SUS' // Suspended
  | 'NON' // Non-Football Injury
  | 'PRA' // Practice Squad
  | 'RET' // Retired
  | 'EXE' // Exempt
  | 'UDF'; // Undrafted Free Agent

/**
 * Season-level roster record
 *
 * Contains player roster information for a given season.
 * Data available back to 1920.
 *
 * @see https://nflreadr.nflverse.com/articles/dictionary_rosters.html
 */
export interface RosterRecord {
  /**
   * NFL season
   */
  season: Season;

  /**
   * Team abbreviation
   */
  team: TeamAbbr;

  /**
   * Primary position
   */
  position: string;

  /**
   * Position assigned on depth chart
   */
  depth_chart_position: string | null;

  /**
   * Jersey number
   */
  jersey_number: number | null;

  /**
   * Roster status
   */
  status: string;

  /**
   * Full name
   */
  full_name: string;

  /**
   * First name
   */
  first_name: string | null;

  /**
   * Last name
   */
  last_name: string | null;

  /**
   * Birth date
   */
  birth_date: DateString | null;

  /**
   * Height in inches
   */
  height: number | null;

  /**
   * Weight in pounds
   */
  weight: number | null;

  /**
   * College attended
   */
  college: string | null;

  /**
   * High school attended
   */
  high_school: string | null;

  /**
   * GSIS ID (primary play-by-play identifier)
   */
  gsis_id: string | null;

  /**
   * ESPN player ID
   */
  espn_id: number | null;

  /**
   * Sportradar player ID
   */
  sportradar_id: string | null;

  /**
   * Yahoo player ID
   */
  yahoo_id: number | null;

  /**
   * Rotowire player ID
   */
  rotowire_id: number | null;

  /**
   * Pro Football Focus player ID
   */
  pff_id: number | null;

  /**
   * Pro Football Reference player ID
   */
  pfr_id: string | null;

  /**
   * FantasyData player ID
   */
  fantasy_data_id: number | null;

  /**
   * Sleeper API player ID
   */
  sleeper_id: string | null;

  /**
   * Years of NFL experience
   */
  years_exp: number | null;

  /**
   * Headshot image URL
   */
  headshot_url: string | null;

  /**
   * NextGen Stats position
   */
  ngs_position: string | null;

  /**
   * Most recent week of season on roster
   */
  week: number | null;

  /**
   * Most recent game type of season on roster
   */
  game_type: GameType | null;

  /**
   * Status description abbreviation
   */
  status_description_abbr: string | null;

  /**
   * Football name (nickname)
   */
  football_name: string | null;

  /**
   * Elias Sports Bureau player ID
   */
  esb_id: string | null;

  /**
   * GSIS IT API player ID
   */
  gsis_it_id: string | null;

  /**
   * ESB ID hash identifier
   */
  smart_id: number | null;

  /**
   * First year eligible to play in NFL
   */
  entry_year: Season | null;

  /**
   * Year rookie eligibility was lost
   */
  rookie_year: Season | null;

  /**
   * Original drafting team (null if undrafted)
   */
  draft_club: TeamAbbr | null;

  /**
   * Draft pick number (overall)
   */
  draft_number: number | null;
}

/**
 * Options for loading roster data
 */
export interface LoadRostersOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
