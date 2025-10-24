/**
 * Team-related type definitions
 * @module types/team
 */

import type { Conference, Division, TeamAbbr } from './common.js';

/**
 * NFL Team information
 */
export interface Team {
  /**
   * Team abbreviation (e.g., "KC", "PHI")
   */
  team_abbr: TeamAbbr;

  /**
   * Full team name (e.g., "Kansas City Chiefs")
   */
  team_name: string;

  /**
   * Team city/location (e.g., "Kansas City")
   */
  team_location: string;

  /**
   * Team nickname (e.g., "Chiefs")
   */
  team_nick: string;

  /**
   * Conference (AFC or NFC)
   */
  team_conf: Conference;

  /**
   * Division (East, West, North, South)
   */
  team_division: Division;

  /**
   * Primary team color (hex code)
   */
  team_color: string;

  /**
   * Secondary team color (hex code)
   */
  team_color2?: string;

  /**
   * Team logo URL
   */
  team_logo_espn?: string;

  /**
   * Team logo square URL
   */
  team_logo_square?: string;

  /**
   * Team wordmark URL
   */
  team_wordmark?: string;

  /**
   * Stadium name
   */
  stadium?: string;

  /**
   * Stadium location
   */
  stadium_location?: string;
}

/**
 * Mapping of team abbreviations to full names
 */
export type TeamMap = Record<TeamAbbr, string>;

/**
 * Team colors
 */
export interface TeamColors {
  primary: string;
  secondary?: string;
  tertiary?: string;
}

/**
 * Valid NFL team abbreviations
 * Standard abbreviations used across nflverse
 */
export const NFL_TEAMS = [
  // AFC East
  'BUF',
  'MIA',
  'NE',
  'NYJ',
  // AFC North
  'BAL',
  'CIN',
  'CLE',
  'PIT',
  // AFC South
  'HOU',
  'IND',
  'JAX',
  'TEN',
  // AFC West
  'DEN',
  'KC',
  'LV',
  'LAC',
  // NFC East
  'DAL',
  'NYG',
  'PHI',
  'WAS',
  // NFC North
  'CHI',
  'DET',
  'GB',
  'MIN',
  // NFC South
  'ATL',
  'CAR',
  'NO',
  'TB',
  // NFC West
  'ARI',
  'LA',
  'SF',
  'SEA',
] as const;

/**
 * Type for valid NFL team abbreviations
 */
export type ValidTeamAbbr = (typeof NFL_TEAMS)[number];

/**
 * Historical team abbreviations (relocated/renamed teams)
 */
export const HISTORICAL_TEAMS = [
  'SD', // San Diego Chargers (now LAC)
  'STL', // St. Louis Rams (now LA)
  'OAK', // Oakland Raiders (now LV)
] as const;

/**
 * Type for historical team abbreviations
 */
export type HistoricalTeamAbbr = (typeof HISTORICAL_TEAMS)[number];

/**
 * All valid team abbreviations (current + historical)
 */
export type AnyTeamAbbr = ValidTeamAbbr | HistoricalTeamAbbr;
