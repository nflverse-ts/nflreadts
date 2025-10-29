/**
 * Player-related type definitions
 * @module types/player
 */

import type { DateString, PlayerId, Position, Season, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Basic player information
 */
export interface Player {
  /**
   * Unique player identifier (GSIS ID)
   */
  player_id: PlayerId;

  /**
   * Player display name (e.g., "Patrick Mahomes")
   */
  player_name: string;

  /**
   * Player first name
   */
  first_name?: string;

  /**
   * Player last name
   */
  last_name?: string;

  /**
   * Player position
   */
  position?: Position;

  /**
   * Current team abbreviation
   */
  team?: TeamAbbr;

  /**
   * Jersey number
   */
  jersey_number?: number;

  /**
   * Player height in inches
   */
  height?: number;

  /**
   * Player weight in pounds
   */
  weight?: number;

  /**
   * Birth date
   */
  birth_date?: DateString;

  /**
   * College attended
   */
  college?: string;

  /**
   * Draft year
   */
  draft_year?: Season;

  /**
   * Draft round
   */
  draft_round?: number;

  /**
   * Draft pick number
   */
  draft_pick?: number;

  /**
   * Years of experience in NFL
   */
  years_exp?: number;

  /**
   * Headshot URL
   */
  headshot_url?: string;

  /**
   * Status (active, injured, reserve, etc.)
   */
  status?: PlayerStatus;

  /**
   * Entry year into NFL
   */
  entry_year?: Season;

  /**
   * Rookie year
   */
  rookie_year?: Season;
}

/**
 * Player status
 */
export type PlayerStatus =
  | 'ACT' // Active
  | 'RES' // Reserve
  | 'IR' // Injured Reserve
  | 'PUP' // Physically Unable to Perform
  | 'SUS' // Suspended
  | 'NON' // Non-Football Injury
  | 'PRA' // Practice Squad
  | 'RET'; // Retired

/**
 * Roster entry for a player
 */
export interface RosterEntry extends Player {
  /**
   * Season
   */
  season: Season;

  /**
   * Week (optional, for weekly rosters)
   */
  week?: number;

  /**
   * Depth chart position/order
   */
  depth_chart_position?: string;

  /**
   * Depth chart order (1 = starter)
   */
  depth_order?: number;

  /**
   * Years with current team
   */
  years_with_team?: number;
}

/**
 * Player statistics (base interface)
 */
export interface PlayerStats {
  /**
   * Player ID
   */
  player_id: PlayerId;

  /**
   * Player name
   */
  player_name: string;

  /**
   * Season
   */
  season: Season;

  /**
   * Week (null for season totals)
   */
  week?: number | null;

  /**
   * Team
   */
  team?: TeamAbbr;

  /**
   * Position
   */
  position?: Position;

  /**
   * Games played
   */
  games?: number;
}

/**
 * Passing statistics
 */
export interface PassingStats extends PlayerStats {
  attempts?: number;
  completions?: number;
  passing_yards?: number;
  passing_tds?: number;
  interceptions?: number;
  sacks?: number;
  sack_yards?: number;
  completion_percentage?: number;
  passing_epa?: number;
}

/**
 * Rushing statistics
 */
export interface RushingStats extends PlayerStats {
  carries?: number;
  rushing_yards?: number;
  rushing_tds?: number;
  rushing_fumbles?: number;
  rushing_epa?: number;
}

/**
 * Receiving statistics
 */
export interface ReceivingStats extends PlayerStats {
  targets?: number;
  receptions?: number;
  receiving_yards?: number;
  receiving_tds?: number;
  receiving_fumbles?: number;
  receiving_epa?: number;
}

/**
 * Defensive statistics
 */
export interface DefensiveStats extends PlayerStats {
  tackles?: number;
  assists?: number;
  sacks?: number;
  interceptions?: number;
  forced_fumbles?: number;
  fumble_recoveries?: number;
  pass_deflections?: number;
}

/**
 * Kicking statistics
 */
export interface KickingStats extends PlayerStats {
  fg_made?: number;
  fg_att?: number;
  fg_pct?: number;
  xp_made?: number;
  xp_att?: number;
  xp_pct?: number;
}

/**
 * Comprehensive player database record
 *
 * The nflverse players dataset - single source of truth for NFL player IDs
 * and biographical information across various data sources.
 *
 * @see https://nflreadr.nflverse.com/reference/load_players.html
 */
export interface PlayerRecord {
  /**
   * GSIS ID (primary identifier for play-by-play)
   */
  gsis_id: string | null;

  /**
   * ESPN player ID
   */
  espn_id: number | null;

  /**
   * Pro Football Focus player ID
   */
  pff_id: number | null;

  /**
   * Pro Football Reference player ID
   */
  pfr_id: string | null;

  /**
   * Over The Cap player ID
   */
  otc_id: string | null;

  /**
   * Elias Sports Bureau player ID
   */
  esb_id: string | null;

  /**
   * Sleeper API player ID
   */
  sleeper_id: string | null;

  /**
   * Sportradar player ID
   */
  sportradar_id: string | null;

  /**
   * FantasyData player ID
   */
  fantasy_data_id: number | null;

  /**
   * Yahoo player ID
   */
  yahoo_id: number | null;

  /**
   * Rotowire player ID
   */
  rotowire_id: number | null;

  /**
   * Player display name
   */
  display_name: string;

  /**
   * Short name (e.g., "P.Mahomes")
   */
  short_name: string | null;

  /**
   * First name
   */
  first_name: string | null;

  /**
   * Last name
   */
  last_name: string | null;

  /**
   * Suffix (e.g., "Jr.", "III")
   */
  suffix: string | null;

  /**
   * Football name (nickname or commonly used name)
   */
  football_name: string | null;

  /**
   * Height in inches
   */
  height: number | null;

  /**
   * Weight in pounds
   */
  weight: number | null;

  /**
   * Birth date
   */
  birth_date: DateString | null;

  /**
   * College attended (usually the last one)
   */
  college: string | null;

  /**
   * High school attended
   */
  high_school: string | null;

  /**
   * Draft year
   */
  draft_year: Season | null;

  /**
   * Draft round
   */
  draft_round: number | null;

  /**
   * Draft pick number within round
   */
  draft_pick: number | null;

  /**
   * Overall draft pick number
   */
  draft_ovr: number | null;

  /**
   * Team that drafted the player
   */
  draft_team: TeamAbbr | null;

  /**
   * Player position
   */
  position: Position | null;

  /**
   * Position group
   */
  position_group: string | null;

  /**
   * PFF position designation
   */
  pff_position: string | null;

  /**
   * Jersey number
   */
  jersey_number: number | null;

  /**
   * Player status
   */
  status: PlayerStatus | null;

  /**
   * PFF status
   */
  pff_status: string | null;

  /**
   * Current team
   */
  team: TeamAbbr | null;

  /**
   * Years of NFL experience
   */
  years_exp: number | null;

  /**
   * Entry year (first year eligible for NFL)
   */
  entry_year: Season | null;

  /**
   * Rookie year (year rookie eligibility was lost)
   */
  rookie_year: Season | null;

  /**
   * Headshot image URL
   */
  headshot_url: string | null;

  /**
   * GSIS IT API player ID
   */
  gsis_it_id: string | null;

  /**
   * ESB ID hash identifier
   */
  smart_id: number | null;

  /**
   * Timestamp of last update
   */
  update_dt: DateString | null;
}

/**
 * Options for loading player data
 */
export interface LoadPlayersOptions extends LoadOptions {
  /**
   * Data format - 'csv' or 'parquet'
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
