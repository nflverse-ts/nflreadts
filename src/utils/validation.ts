/**
 * Validation utilities
 * @module utils/validation
 */

import { ErrorCode, ValidationError } from '../types/error.js';
import { HISTORICAL_TEAMS, NFL_TEAMS } from '../types/team.js';

import type { Season, SeasonType, TeamAbbr, Week } from '../types/common.js';
import type { AnyTeamAbbr } from '../types/team.js';

/**
 * Minimum valid NFL season (modern era)
 */
export const MIN_SEASON = 1999;

/**
 * Maximum regular season week
 */
export const MAX_REGULAR_SEASON_WEEK = 18;

/**
 * Maximum playoff week
 */
export const MAX_PLAYOFF_WEEK = 22;

/**
 * Valid season types
 */
export const SEASON_TYPES: readonly SeasonType[] = ['REG', 'POST', 'PRE'] as const;

/**
 * Get current NFL season based on date
 * NFL season starts in September
 */
export function getCurrentSeason(): Season {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // If we're in January-August, current season is previous year
  // If we're in September-December, current season is current year
  return month < 8 ? year - 1 : year;
}

/**
 * Validate a season number
 */
export function isValidSeason(season: number): season is Season {
  return (
    Number.isInteger(season) && season >= MIN_SEASON && season <= getCurrentSeason() + 1 // Allow next season for scheduling
  );
}

/**
 * Assert a season is valid, throwing ValidationError if not
 */
export function assertValidSeason(season: number): asserts season is Season {
  if (!isValidSeason(season)) {
    const maxSeason = getCurrentSeason() + 1;
    throw new ValidationError(
      `Invalid season: ${String(season)}. Must be between ${MIN_SEASON} and ${maxSeason}`,
      ErrorCode.INVALID_SEASON,
      { season, minSeason: MIN_SEASON, maxSeason }
    );
  }
}

/**
 * Validate a week number
 */
export function isValidWeek(week: number, seasonType: SeasonType = 'REG'): week is Week {
  if (!Number.isInteger(week) || week < 1) {
    return false;
  }

  switch (seasonType) {
    case 'REG':
      return week <= MAX_REGULAR_SEASON_WEEK;
    case 'POST':
      return week >= 19 && week <= MAX_PLAYOFF_WEEK;
    case 'PRE':
      return week <= 4; // Preseason typically has 4 weeks
    default:
      return false;
  }
}

/**
 * Assert a week is valid, throwing ValidationError if not
 */
export function assertValidWeek(
  week: number,
  seasonType: SeasonType = 'REG'
): asserts week is Week {
  if (!isValidWeek(week, seasonType)) {
    const maxWeek =
      seasonType === 'REG' ? MAX_REGULAR_SEASON_WEEK : seasonType === 'POST' ? MAX_PLAYOFF_WEEK : 4;

    throw new ValidationError(
      `Invalid week: ${String(week)} for season type ${seasonType}. Must be between 1 and ${maxWeek}`,
      ErrorCode.INVALID_WEEK,
      { week, seasonType, maxWeek }
    );
  }
}

/**
 * Validate a team abbreviation (current teams only)
 */
export function isValidTeam(team: string): team is TeamAbbr {
  return (NFL_TEAMS as readonly string[]).includes(team);
}

/**
 * Validate a team abbreviation (including historical teams)
 */
export function isValidTeamOrHistorical(team: string): team is AnyTeamAbbr {
  return (
    (NFL_TEAMS as readonly string[]).includes(team) ||
    (HISTORICAL_TEAMS as readonly string[]).includes(team)
  );
}

/**
 * Assert a team abbreviation is valid, throwing ValidationError if not
 */
export function assertValidTeam(team: string, allowHistorical = true): asserts team is TeamAbbr {
  const isValid = allowHistorical ? isValidTeamOrHistorical(team) : isValidTeam(team);

  if (!isValid) {
    throw new ValidationError(`Invalid team abbreviation: ${team}`, ErrorCode.INVALID_TEAM, {
      team,
      allowHistorical,
    });
  }
}

/**
 * Validate a season type
 */
export function isValidSeasonType(seasonType: string): seasonType is SeasonType {
  return SEASON_TYPES.includes(seasonType as SeasonType);
}

/**
 * Assert a season type is valid, throwing ValidationError if not
 */
export function assertValidSeasonType(seasonType: string): asserts seasonType is SeasonType {
  if (!isValidSeasonType(seasonType)) {
    throw new ValidationError(
      `Invalid season type: ${seasonType}. Must be one of: ${SEASON_TYPES.join(', ')}`,
      ErrorCode.INVALID_PARAMETER,
      { seasonType, validTypes: SEASON_TYPES }
    );
  }
}

/**
 * Validate a player ID (basic format check)
 */
export function isValidPlayerId(playerId: string): boolean {
  // Player IDs are typically in format: XX-XXXXXXX
  return typeof playerId === 'string' && playerId.length > 0;
}

/**
 * Assert a player ID is valid, throwing ValidationError if not
 */
export function assertValidPlayerId(playerId: string): void {
  if (!isValidPlayerId(playerId)) {
    throw new ValidationError(`Invalid player ID: ${playerId}`, ErrorCode.INVALID_PLAYER, {
      playerId,
    });
  }
}

/**
 * Validate an array of seasons
 */
export function validateSeasons(seasons: number[]): Season[] {
  const validSeasons: Season[] = [];

  for (const season of seasons) {
    assertValidSeason(season);
    validSeasons.push(season);
  }

  return validSeasons;
}

/**
 * Validate an array of teams
 */
export function validateTeams(teams: string[], allowHistorical = true): TeamAbbr[] {
  const validTeams: TeamAbbr[] = [];

  for (const team of teams) {
    assertValidTeam(team, allowHistorical);
    validTeams.push(team);
  }

  return validTeams;
}

/**
 * Normalize team abbreviation to handle common variations
 */
export function normalizeTeamAbbr(team: string): string {
  const upper = team.toUpperCase().trim();

  // Handle common variations
  const variations: Record<string, string> = {
    LAR: 'LA', // Los Angeles Rams
    WSH: 'WAS', // Washington
    WFT: 'WAS', // Washington Football Team (historical)
  };

  return variations[upper] ?? upper;
}
