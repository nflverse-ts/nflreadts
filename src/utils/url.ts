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
 */
export function buildPbpUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('pbp', `play_by_play_${season}`, format);
}

/**
 * Build URL for player stats
 */
export function buildPlayerStatsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('player_stats', `player_stats_${season}`, format);
}

/**
 * Build URL for roster data
 */
export function buildRosterUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('rosters', `roster_${season}`, format);
}

/**
 * Build URL for weekly roster data
 */
export function buildWeeklyRosterUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('rosters', `roster_weekly_${season}`, format);
}

/**
 * Build URL for schedule data
 */
export function buildScheduleUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('schedules', `sched_${season}`, format);
}

/**
 * Build URL for teams data
 */
export function buildTeamsUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('teams', 'teams', format);
}

/**
 * Build URL for players data
 */
export function buildPlayersUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('players', 'players', format);
}

/**
 * Build URL for participation data
 */
export function buildParticipationUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('participation', `participation_${season}`, format);
}

/**
 * Build URL for depth charts
 */
export function buildDepthChartsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('depth_charts', `depth_charts_${season}`, format);
}

/**
 * Build URL for injuries data
 */
export function buildInjuriesUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('injuries', `injuries_${season}`, format);
}

/**
 * Build URL for draft picks
 */
export function buildDraftPicksUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('draft_picks', `draft_picks_${season}`, format);
}

/**
 * Build URL for contracts
 */
export function buildContractsUrl(format: FileFormat = 'csv'): string {
  return buildNflverseUrl('contracts', 'contracts', format);
}

/**
 * Build URL for Next Gen Stats
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
 */
export function buildSnapCountsUrl(season: Season, format: FileFormat = 'csv'): string {
  return buildNflverseUrl('snap_counts', `snap_counts_${season}`, format);
}

/**
 * Parse query parameters into URL search params
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
