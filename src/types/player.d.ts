/**
 * Player-related type definitions
 * @module types/player
 */

import type { DateString, PlayerId, Position, Season, TeamAbbr } from './common.js';

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
