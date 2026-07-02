/**
 * Validation utilities
 * @module utils/validation
 */

import type { Season, SeasonType, TeamAbbr, Week } from '../types/common.js';
import {
  HISTORICAL_TEAMS,
  MAX_PLAYOFF_WEEK,
  MAX_REGULAR_SEASON_WEEK,
  MIN_SEASON,
  NFL_TEAMS,
  SEASON_TYPES,
} from '../types/constants.js';
import { ErrorCode, ValidationError } from '../types/error.js';
import type { AnyTeamAbbr } from '../types/team.js';
import { getCurrentSeason } from './datetime.js';

/**
 * Validate a season number
 * Checks if season is within valid range (MIN_SEASON to current season + 1)
 *
 * @param season - Season number to validate
 * @returns True if season is valid
 *
 * @example
 * ```typescript
 * isValidSeason(2023);
 * // Returns: true
 *
 * isValidSeason(1800);
 * // Returns: false (too early)
 * ```
 */
export function isValidSeason(season: number): season is Season {
  return (
    Number.isInteger(season) && season >= MIN_SEASON && season <= getCurrentSeason() + 1 // Allow next season for scheduling
  );
}

/**
 * Assert a season is valid, throwing ValidationError if not
 * Use this when you want to validate and ensure type safety
 *
 * @param season - Season number to validate
 * @throws {ValidationError} If season is invalid
 *
 * @example
 * ```typescript
 * assertValidSeason(2023); // No error
 *
 * assertValidSeason(1800);
 * // Throws: ValidationError: Invalid season: 1800...
 * ```
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
 * Week ranges vary by season type: REG (1-18), POST (19-22), PRE (1-4)
 *
 * @param week - Week number to validate
 * @param seasonType - Type of season (REG, POST, or PRE)
 * @returns True if week is valid for the season type
 *
 * @example
 * ```typescript
 * isValidWeek(5, 'REG');
 * // Returns: true
 *
 * isValidWeek(20, 'POST');
 * // Returns: true
 *
 * isValidWeek(20, 'REG');
 * // Returns: false (too high for regular season)
 * ```
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
 *
 * @param week - Week number to validate
 * @param seasonType - Type of season (REG, POST, or PRE)
 * @throws {ValidationError} If week is invalid for the season type
 *
 * @example
 * ```typescript
 * assertValidWeek(5, 'REG'); // No error
 *
 * assertValidWeek(20, 'REG');
 * // Throws: ValidationError: Invalid week: 20 for season type REG...
 * ```
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
 * Does not include historical/relocated teams
 *
 * @param team - Team abbreviation to validate
 * @returns True if team is a current NFL team
 *
 * @example
 * ```typescript
 * isValidTeam('KC');
 * // Returns: true
 *
 * isValidTeam('STL'); // St. Louis Rams (relocated)
 * // Returns: false
 * ```
 */
export function isValidTeam(team: string): team is TeamAbbr {
  return (NFL_TEAMS as readonly string[]).includes(team);
}

/**
 * Validate a team abbreviation (including historical teams)
 * Includes relocated or renamed teams
 *
 * @param team - Team abbreviation to validate
 * @returns True if team is a current or historical NFL team
 *
 * @example
 * ```typescript
 * isValidTeamOrHistorical('KC');
 * // Returns: true
 *
 * isValidTeamOrHistorical('STL'); // St. Louis Rams
 * // Returns: true
 * ```
 */
export function isValidTeamOrHistorical(team: string): team is AnyTeamAbbr {
  return (
    (NFL_TEAMS as readonly string[]).includes(team) ||
    (HISTORICAL_TEAMS as readonly string[]).includes(team)
  );
}

/**
 * Assert a team abbreviation is valid, throwing ValidationError if not
 *
 * @param team - Team abbreviation to validate
 * @param allowHistorical - Whether to allow historical teams (default: true)
 * @throws {ValidationError} If team is invalid
 *
 * @example
 * ```typescript
 * assertValidTeam('KC'); // No error
 *
 * assertValidTeam('INVALID');
 * // Throws: ValidationError: Invalid team abbreviation: INVALID
 * ```
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
 * Valid types: 'REG' (regular season), 'POST' (postseason), 'PRE' (preseason)
 *
 * @param seasonType - Season type to validate
 * @returns True if season type is valid
 *
 * @example
 * ```typescript
 * isValidSeasonType('REG');
 * // Returns: true
 *
 * isValidSeasonType('INVALID');
 * // Returns: false
 * ```
 */
export function isValidSeasonType(seasonType: string): seasonType is SeasonType {
  return SEASON_TYPES.includes(seasonType as SeasonType);
}

/**
 * Assert a season type is valid, throwing ValidationError if not
 *
 * @param seasonType - Season type to validate
 * @throws {ValidationError} If season type is invalid
 *
 * @example
 * ```typescript
 * assertValidSeasonType('REG'); // No error
 *
 * assertValidSeasonType('INVALID');
 * // Throws: ValidationError: Invalid season type: INVALID...
 * ```
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
 * Currently just checks that it's a non-empty string
 *
 * @param playerId - Player ID to validate
 * @returns True if player ID is valid
 *
 * @example
 * ```typescript
 * isValidPlayerId('00-0012345');
 * // Returns: true
 *
 * isValidPlayerId('');
 * // Returns: false
 * ```
 */
export function isValidPlayerId(playerId: string): boolean {
  // Player IDs are typically in format: XX-XXXXXXX
  return typeof playerId === 'string' && playerId.length > 0;
}

/**
 * Assert a player ID is valid, throwing ValidationError if not
 *
 * @param playerId - Player ID to validate
 * @throws {ValidationError} If player ID is invalid
 *
 * @example
 * ```typescript
 * assertValidPlayerId('00-0012345'); // No error
 *
 * assertValidPlayerId('');
 * // Throws: ValidationError: Invalid player ID: ...
 * ```
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
 * Throws on first invalid season
 *
 * @param seasons - Array of season numbers to validate
 * @returns Array of validated seasons (same as input if all valid)
 * @throws {ValidationError} If any season is invalid
 *
 * @example
 * ```typescript
 * validateSeasons([2020, 2021, 2022]);
 * // Returns: [2020, 2021, 2022]
 *
 * validateSeasons([2020, 1800]);
 * // Throws: ValidationError: Invalid season: 1800...
 * ```
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
 * Throws on first invalid team
 *
 * @param teams - Array of team abbreviations to validate
 * @param allowHistorical - Whether to allow historical teams (default: true)
 * @returns Array of validated teams (same as input if all valid)
 * @throws {ValidationError} If any team is invalid
 *
 * @example
 * ```typescript
 * validateTeams(['KC', 'SF', 'BUF']);
 * // Returns: ['KC', 'SF', 'BUF']
 *
 * validateTeams(['KC', 'INVALID']);
 * // Throws: ValidationError: Invalid team abbreviation: INVALID
 * ```
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
 * Converts to uppercase and handles known variations
 *
 * @param team - Team abbreviation to normalize
 * @returns Normalized team abbreviation
 *
 * @example
 * ```typescript
 * normalizeTeamAbbr('lar');
 * // Returns: 'LA'
 *
 * normalizeTeamAbbr('WSH');
 * // Returns: 'WAS'
 *
 * normalizeTeamAbbr('kc');
 * // Returns: 'KC'
 * ```
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

/**
 * Valid data formats for loading
 */
export const VALID_FORMATS = ['csv', 'parquet', 'json', 'rds'] as const;
export type DataFormat = (typeof VALID_FORMATS)[number];

/**
 * Validate a data format
 *
 * @param format - Format to validate
 * @returns True if format is valid
 *
 * @example
 * ```typescript
 * isValidFormat('csv');
 * // Returns: true
 *
 * isValidFormat('xml');
 * // Returns: false
 * ```
 */
export function isValidFormat(format: string): format is DataFormat {
  return VALID_FORMATS.includes(format as DataFormat);
}

/**
 * Assert a format is valid, throwing ValidationError if not
 *
 * @param format - Format to validate
 * @throws {ValidationError} If format is invalid
 *
 * @example
 * ```typescript
 * assertValidFormat('csv'); // No error
 *
 * assertValidFormat('xml');
 * // Throws: ValidationError: Invalid format: xml...
 * ```
 */
export function assertValidFormat(format: string): asserts format is DataFormat {
  if (!isValidFormat(format)) {
    throw new ValidationError(
      `Invalid format: ${format}. Must be one of: ${VALID_FORMATS.join(', ')}`,
      ErrorCode.INVALID_PARAMETER,
      { format, validFormats: VALID_FORMATS }
    );
  }
}

/**
 * Validate a game ID format
 * Game IDs typically follow pattern: YYYY_WW_AWAY_HOME
 *
 * @param gameId - Game ID to validate
 * @returns True if game ID is valid format
 *
 * @example
 * ```typescript
 * isValidGameId('2023_01_KC_PHI');
 * // Returns: true
 *
 * isValidGameId('invalid');
 * // Returns: false
 * ```
 */
export function isValidGameId(gameId: string): boolean {
  if (typeof gameId !== 'string' || gameId.length === 0) {
    return false;
  }

  // Basic format check: YYYY_WW_XXX_YYY
  // More lenient to handle various formats
  const parts = gameId.split('_');
  if (parts.length < 4) {
    return false;
  }

  // Check year part (should be 4 digits)
  const year = Number.parseInt(parts[0] ?? '', 10);
  if (!Number.isInteger(year) || year < MIN_SEASON) {
    return false;
  }

  // Check week part (should be 2 digits)
  const week = Number.parseInt(parts[1] ?? '', 10);
  if (!Number.isInteger(week) || week < 1 || week > MAX_PLAYOFF_WEEK) {
    return false;
  }

  return true;
}

/**
 * Assert a game ID is valid, throwing ValidationError if not
 *
 * @param gameId - Game ID to validate
 * @throws {ValidationError} If game ID is invalid
 *
 * @example
 * ```typescript
 * assertValidGameId('2023_01_KC_PHI'); // No error
 *
 * assertValidGameId('invalid');
 * // Throws: ValidationError: Invalid game ID: invalid
 * ```
 */
export function assertValidGameId(gameId: string): void {
  if (!isValidGameId(gameId)) {
    throw new ValidationError(
      `Invalid game ID: ${gameId}. Expected format: YYYY_WW_AWAY_HOME`,
      ErrorCode.INVALID_PARAMETER,
      { gameId }
    );
  }
}

/**
 * Validate a number is within a range
 *
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range
 *
 * @example
 * ```typescript
 * isInRange(5, 1, 10);
 * // Returns: true
 *
 * isInRange(15, 1, 10);
 * // Returns: false
 * ```
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Assert a number is within a range, throwing ValidationError if not
 *
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param name - Name of the value for error message
 * @throws {ValidationError} If value is out of range
 *
 * @example
 * ```typescript
 * assertInRange(5, 1, 10, 'week'); // No error
 *
 * assertInRange(15, 1, 10, 'week');
 * // Throws: ValidationError: week must be between 1 and 10
 * ```
 */
export function assertInRange(value: number, min: number, max: number, name = 'value'): void {
  if (!isInRange(value, min, max)) {
    throw new ValidationError(
      `${name} must be between ${min} and ${max}, got ${value}`,
      ErrorCode.INVALID_PARAMETER,
      { value, min, max, name }
    );
  }
}

/**
 * Validate an array is not empty
 *
 * @param array - Array to validate
 * @returns True if array is not empty
 *
 * @example
 * ```typescript
 * isNonEmptyArray([1, 2, 3]);
 * // Returns: true
 *
 * isNonEmptyArray([]);
 * // Returns: false
 * ```
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Assert an array is not empty, throwing ValidationError if it is
 *
 * @param array - Array to validate
 * @param name - Name of the array for error message
 * @throws {ValidationError} If array is empty
 *
 * @example
 * ```typescript
 * assertNonEmptyArray([1, 2, 3], 'seasons'); // No error
 *
 * assertNonEmptyArray([], 'seasons');
 * // Throws: ValidationError: seasons array cannot be empty
 * ```
 */
export function assertNonEmptyArray<T>(array: T[], name = 'array'): asserts array is [T, ...T[]] {
  if (!isNonEmptyArray(array)) {
    throw new ValidationError(`${name} cannot be empty`, ErrorCode.INVALID_PARAMETER, { name });
  }
}

/**
 * Validate a value is one of the allowed values
 *
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @returns True if value is in allowed values
 *
 * @example
 * ```typescript
 * isOneOf('REG', ['REG', 'POST', 'PRE']);
 * // Returns: true
 *
 * isOneOf('INVALID', ['REG', 'POST', 'PRE']);
 * // Returns: false
 * ```
 */
export function isOneOf<T>(value: unknown, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Assert a value is one of the allowed values, throwing ValidationError if not
 *
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param name - Name of the value for error message
 * @throws {ValidationError} If value is not in allowed values
 *
 * @example
 * ```typescript
 * assertOneOf('REG', ['REG', 'POST', 'PRE'], 'season type'); // No error
 *
 * assertOneOf('INVALID', ['REG', 'POST', 'PRE'], 'season type');
 * // Throws: ValidationError: season type must be one of: REG, POST, PRE
 * ```
 */
export function assertOneOf<T>(
  value: unknown,
  allowedValues: readonly T[],
  name = 'value'
): asserts value is T {
  if (!isOneOf(value, allowedValues)) {
    throw new ValidationError(
      `${name} must be one of: ${allowedValues.join(', ')}, got ${String(value)}`,
      ErrorCode.INVALID_PARAMETER,
      { value, allowedValues, name }
    );
  }
}

/**
 * Validate an optional value (null/undefined are valid)
 * If value is present, run the provided validator
 *
 * @param value - Value to validate
 * @param validator - Validator function to run if value is present
 * @returns True if value is null/undefined or passes validation
 *
 * @example
 * ```typescript
 * isValidOptional(null, isValidSeason);
 * // Returns: true
 *
 * isValidOptional(2023, isValidSeason);
 * // Returns: true
 *
 * isValidOptional(1800, isValidSeason);
 * // Returns: false
 * ```
 */
export function isValidOptional<T>(
  value: T | null | undefined,
  validator: (value: T) => boolean
): boolean {
  if (value == null) {
    return true;
  }
  return validator(value);
}

/**
 * Create a validator for optional values
 *
 * @param validator - Base validator function
 * @returns New validator that allows null/undefined
 *
 * @example
 * ```typescript
 * const isValidOptionalSeason = optional(isValidSeason);
 *
 * isValidOptionalSeason(null); // true
 * isValidOptionalSeason(2023); // true
 * isValidOptionalSeason(1800); // false
 * ```
 */
export function optional<T>(
  validator: (value: T) => boolean
): (value: T | null | undefined) => boolean {
  return (value) => isValidOptional(value, validator);
}
