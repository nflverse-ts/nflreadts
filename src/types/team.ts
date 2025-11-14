/**
 * Team data loading types
 * @module types/team
 */

import type { Conference, Division, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Any team abbreviation including current and historical teams
 * Includes relocated/renamed teams like 'SD', 'STL', 'OAK'
 */
export type AnyTeamAbbr = string;

/**
 * Team record with comprehensive metadata, logos, and branding
 *
 * This interface matches the nflreadr::load_teams() output structure
 * Useful for plots and team-based visualizations
 *
 * @see https://nflreadr.nflverse.com/reference/load_teams.html
 */
export interface TeamRecord {
  /**
   * Team abbreviation (standardized)
   * @example "KC"
   */
  team_abbr: TeamAbbr;

  /**
   * Full team name
   * @example "Kansas City Chiefs"
   */
  team_name: string;

  /**
   * Numeric team identifier
   */
  team_id: number;

  /**
   * Team nickname
   * @example "Chiefs"
   */
  team_nick: string;

  /**
   * Conference assignment
   */
  team_conf: Conference;

  /**
   * Division assignment
   */
  team_division: Division;

  /**
   * Primary team color (hex code)
   * @example "#E31837"
   */
  team_color: string;

  /**
   * Secondary team color (hex code)
   * @example "#FFB81C"
   */
  team_color2: string;

  /**
   * Tertiary team color (hex code)
   * May be null if not applicable
   */
  team_color3: string | null;

  /**
   * Quaternary team color (hex code)
   * May be null if not applicable
   */
  team_color4: string | null;

  /**
   * Wikipedia logo URL
   */
  team_logo_wikipedia: string;

  /**
   * ESPN logo URL
   */
  team_logo_espn: string;

  /**
   * Team wordmark URL
   */
  team_wordmark: string;

  /**
   * Conference logo URL
   */
  team_conference_logo: string;

  /**
   * NFL league logo URL
   */
  team_league_logo: string;

  /**
   * Square format team logo URL
   */
  team_logo_squared: string;
}

/**
 * Options for loading team data
 */
export interface LoadTeamsOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';

  /**
   * Filter for current/active teams only
   * When true, returns only current NFL teams with standard abbreviations
   * When false, includes historical teams and non-standard abbreviations
   * @default true
   */
  current?: boolean;
}
