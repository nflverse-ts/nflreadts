/**
 * Team-related type definitions
 * @module types/team
 */

import type { Conference, Division, TeamAbbr } from './common.js';
import type { HISTORICAL_TEAMS, NFL_TEAMS } from './constants.js';

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
 * Type for valid NFL team abbreviations
 */
export type ValidTeamAbbr = (typeof NFL_TEAMS)[number];

/**
 * Type for historical team abbreviations
 */
export type HistoricalTeamAbbr = (typeof HISTORICAL_TEAMS)[number];

/**
 * All valid team abbreviations (current + historical)
 */
export type AnyTeamAbbr = ValidTeamAbbr | HistoricalTeamAbbr;
