/**
 * URL building utilities for nflverse endpoints
 * @module utils/url
 */

import { getConfig } from '../config/manager.js';

import type { Season } from '../types/common.js';

/**
 * Data file types available from nflverse
 */
export type DataFileType =
  | 'pbp' // Play-by-play
  | 'player_stats' // Player statistics
  | 'rosters' // Team rosters
  | 'schedules' // Game schedules
  | 'teams' // Team information
  | 'players' // Player information
  | 'participation' // Participation data
  | 'depth_charts' // Depth charts
  | 'injuries' // Injury reports
  | 'draft_picks' // Draft picks
  | 'contracts' // Player contracts
  | 'nextgen_stats' // Next Gen Stats
  | 'qbr' // ESPN QBR
  | 'pfr' // Pro Football Reference data
  | 'snap_counts'; // Snap counts

/**
 * File format for data downloads
 */
export type FileFormat = 'csv' | 'parquet' | 'rds' | 'json';

/**
 * Build a URL for nflverse data
 *
 * @param dataType - Type of NFL data to fetch
 * @param fileName - Name of the file (without extension)
 * @param format - File format (csv, parquet, rds, json)
 * @returns Complete URL to the nflverse data file
 *
 * @example
 * ```typescript
 * buildNflverseUrl('rosters', 'roster_2023', 'csv');
 * // Returns: 'https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2023.csv'
 * ```
 */
export function buildNflverseUrl(
  dataType: DataFileType,
  fileName: string,
  format: FileFormat = 'csv'
): string {
  const config = getConfig();
  const baseUrl = config.dataSources.baseUrl;

  // nflverse URLs follow pattern: {baseUrl}/{dataType}/{fileName}.{format}
  return `${baseUrl}/${dataType}/${fileName}.${format}`;
}

/**
 * Build URL for play-by-play data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the play-by-play data file
 *
 * @example
 * ```typescript
 * buildPbpUrl(2023, 'parquet');
 * // Returns URL for 2023 play-by-play data in parquet format
 * ```
 */
export function buildPbpUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('pbp', `play_by_play_${season}`, format);
}

/**
 * Build URL for player stats
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the player stats data file
 *
 * @example
 * ```typescript
 * buildPlayerStatsUrl(2023);
 * // Returns URL for 2023 player stats in CSV format
 * ```
 */
export function buildPlayerStatsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('player_stats', `player_stats_${season}`, format);
}

/**
 * Build URL for roster data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the roster data file
 *
 * @example
 * ```typescript
 * buildRosterUrl(2023);
 * // Returns URL for 2023 roster data
 * ```
 */
export function buildRosterUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('rosters', `roster_${season}`, format);
}

/**
 * Build URL for weekly roster data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the weekly roster data file
 *
 * @example
 * ```typescript
 * buildWeeklyRosterUrl(2023);
 * // Returns URL for 2023 weekly roster data
 * ```
 */
export function buildWeeklyRosterUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('rosters', `roster_weekly_${season}`, format);
}

/**
 * Build URL for schedule data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the schedule data file
 *
 * @example
 * ```typescript
 * buildScheduleUrl(2023);
 * // Returns URL for 2023 schedule data
 * ```
 */
export function buildScheduleUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('schedules', `sched_${season}`, format);
}

/**
 * Build URL for teams data
 *
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the teams data file
 *
 * @example
 * ```typescript
 * buildTeamsUrl('csv');
 * // Returns URL for teams data in CSV format
 * ```
 */
export function buildTeamsUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('teams', 'teams', format);
}

/**
 * Build URL for players data
 *
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the players data file
 *
 * @example
 * ```typescript
 * buildPlayersUrl('parquet');
 * // Returns URL for players data in parquet format
 * ```
 */
export function buildPlayersUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('players', 'players', format);
}

/**
 * Build URL for participation data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the participation data file
 *
 * @example
 * ```typescript
 * buildParticipationUrl(2023);
 * // Returns URL for 2023 participation data
 * ```
 */
export function buildParticipationUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('participation', `participation_${season}`, format);
}

/**
 * Build URL for depth charts
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the depth charts data file
 *
 * @example
 * ```typescript
 * buildDepthChartsUrl(2023);
 * // Returns URL for 2023 depth charts
 * ```
 */
export function buildDepthChartsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('depth_charts', `depth_charts_${season}`, format);
}

/**
 * Build URL for injuries data
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the injuries data file
 *
 * @example
 * ```typescript
 * buildInjuriesUrl(2023);
 * // Returns URL for 2023 injuries data
 * ```
 */
export function buildInjuriesUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('injuries', `injuries_${season}`, format);
}

/**
 * Build URL for draft picks
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the draft picks data file
 *
 * @example
 * ```typescript
 * buildDraftPicksUrl(2023);
 * // Returns URL for 2023 draft picks
 * ```
 */
export function buildDraftPicksUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('draft_picks', `draft_picks_${season}`, format);
}

/**
 * Build URL for contracts
 *
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the contracts data file
 *
 * @example
 * ```typescript
 * buildContractsUrl();
 * // Returns URL for contracts data
 * ```
 */
export function buildContractsUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('contracts', 'contracts', format);
}

/**
 * Build URL for Next Gen Stats
 *
 * @param season - NFL season year
 * @param statType - Type of Next Gen stat (e.g., 'passing', 'rushing', 'receiving')
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the Next Gen Stats data file
 *
 * @example
 * ```typescript
 * buildNextGenStatsUrl(2023, 'passing');
 * // Returns URL for 2023 Next Gen passing stats
 * ```
 */
export function buildNextGenStatsUrl(
  season: Season,
  statType: string,
  format: FileFormat = 'csv'
): string {
  return buildNflverseUrl('nextgen_stats', `ngs_${statType}_${season}`, format);
}

/**
 * Build URL for snap counts
 *
 * @param season - NFL season year
 * @param format - File format (csv, parquet, rds, json)
 * @returns URL to the snap counts data file
 *
 * @example
 * ```typescript
 * buildSnapCountsUrl(2023);
 * // Returns URL for 2023 snap counts
 * ```
 */
export function buildSnapCountsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('snap_counts', `snap_counts_${season}`, format);
}

/**
 * Parse query parameters into URL search params
 * Filters out undefined and null values automatically
 *
 * @param params - Object containing query parameters
 * @returns Query string (with leading '?') or empty string if no params
 *
 * @example
 * ```typescript
 * buildQueryString({ season: 2023, week: 1, team: 'KC' });
 * // Returns: '?season=2023&week=1&team=KC'
 *
 * buildQueryString({ foo: undefined });
 * // Returns: ''
 * ```
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Add query parameters to a URL
 *
 * @param url - Base URL
 * @param params - Object containing query parameters
 * @returns URL with appended query string
 *
 * @example
 * ```typescript
 * addQueryParams('https://api.example.com/data', { season: 2023 });
 * // Returns: 'https://api.example.com/data?season=2023'
 * ```
 */
export function addQueryParams(
  url: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const queryString = buildQueryString(params);
  return queryString ? `${url}${queryString}` : url;
}

/**
 * Extract filename from URL
 * Returns 'unknown' if URL is invalid or has no filename
 *
 * @param url - URL to extract filename from
 * @returns Filename from URL or 'unknown'
 *
 * @example
 * ```typescript
 * getFilenameFromUrl('https://example.com/data/roster_2023.csv');
 * // Returns: 'roster_2023.csv'
 *
 * getFilenameFromUrl('invalid-url');
 * // Returns: 'unknown'
 * ```
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Check if URL is from nflverse
 * Returns false for invalid URLs
 *
 * @param url - URL to check
 * @returns True if URL is from nflverse GitHub repository
 *
 * @example
 * ```typescript
 * isNflverseUrl('https://github.com/nflverse/nflverse-data/releases/download/...');
 * // Returns: true
 *
 * isNflverseUrl('https://example.com/data');
 * // Returns: false
 * ```
 */
export function isNflverseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('github.com') && url.includes('nflverse');
  } catch {
    return false;
  }
}

/**
 * Normalize URL (remove trailing slashes, etc.)
 * Returns cleaned URL or original with trailing slash removed if parsing fails
 *
 * @param url - URL to normalize
 * @returns Normalized URL without trailing slash
 *
 * @example
 * ```typescript
 * normalizeUrl('https://example.com/data/');
 * // Returns: 'https://example.com/data'
 *
 * normalizeUrl('https://example.com/data');
 * // Returns: 'https://example.com/data'
 * ```
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash from pathname
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
    return urlObj.toString();
  } catch {
    // If URL parsing fails, just remove trailing slash
    return url.replace(/\/$/, '');
  }
}

/**
 * Join URL parts safely
 * Handles leading and trailing slashes automatically
 *
 * @param parts - URL parts to join
 * @returns Joined URL string
 *
 * @example
 * ```typescript
 * joinUrlParts('https://example.com', '/data/', '/rosters');
 * // Returns: 'https://example.com/data/rosters'
 *
 * joinUrlParts('api', 'v1', 'users');
 * // Returns: 'api/v1/users'
 * ```
 */
export function joinUrlParts(...parts: string[]): string {
  return parts
    .map((part, index) => {
      // Remove leading slash from all parts except first
      if (index > 0) {
        part = part.replace(/^\/+/, '');
      }
      // Remove trailing slash from all parts except last
      if (index < parts.length - 1) {
        part = part.replace(/\/+$/, '');
      }
      return part;
    })
    .join('/');
}
