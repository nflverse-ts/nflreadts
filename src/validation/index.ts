/**
 * Centralized validation layer for nflreadts
 *
 * This module provides a comprehensive validation framework with:
 * - Input sanitization and normalization
 * - Type coercion with runtime checks
 * - Composite validators for complex inputs
 * - Runtime type guards
 * - Validation result types
 *
 * @module validation
 */

import type { Season, SeasonType, TeamAbbr, Week } from '../types/common.js';
import { MAX_PLAYOFF_WEEK, MAX_REGULAR_SEASON_WEEK, MIN_SEASON } from '../types/constants.js';
import { ErrorCode, ValidationError } from '../types/error.js';
import type { AnyTeamAbbr } from '../types/team.js';
import { getCurrentSeason } from '../utils/datetime.js';
import {
  assertValidSeason,
  assertValidSeasonType,
  assertValidTeam,
  assertValidWeek,
  isValidSeason,
  isValidSeasonType,
  isValidTeam,
  isValidTeamOrHistorical,
  isValidWeek,
  normalizeTeamAbbr,
} from '../utils/validation.js';

/**
 * Validation result for single value
 */
export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  error?: ValidationError;
}

/**
 * Options for season validation
 */
export interface SeasonValidationOptions {
  /**
   * Minimum allowed season (defaults to MIN_SEASON)
   */
  minSeason?: number;

  /**
   * Maximum allowed season (defaults to current season + 1)
   */
  maxSeason?: number;

  /**
   * Whether to allow future seasons
   */
  allowFuture?: boolean;

  /**
   * Whether to coerce string inputs to numbers
   */
  coerce?: boolean;
}

/**
 * Options for week validation
 */
export interface WeekValidationOptions {
  /**
   * Season type for context-aware validation
   */
  seasonType?: SeasonType;

  /**
   * Whether to coerce string inputs to numbers
   */
  coerce?: boolean;
}

/**
 * Options for team validation
 */
export interface TeamValidationOptions {
  /**
   * Whether to allow historical teams
   */
  allowHistorical?: boolean;

  /**
   * Whether to normalize team abbreviations
   */
  normalize?: boolean;

  /**
   * Whether to coerce to uppercase
   */
  coerce?: boolean;
}

/**
 * Options for array validation
 */
export interface ArrayValidationOptions {
  /**
   * Minimum array length
   */
  minLength?: number;

  /**
   * Maximum array length
   */
  maxLength?: number;

  /**
   * Whether to remove duplicates
   */
  unique?: boolean;
}

// ==========================================
// INPUT SANITIZATION
// ==========================================

/**
 * Sanitize a string input by trimming whitespace
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Sanitize a number input by ensuring it's a valid number
 *
 * @param input - Number to sanitize
 * @returns Sanitized number or NaN if invalid
 */
export function sanitizeNumber(input: number): number {
  return Number.isFinite(input) ? input : NaN;
}

/**
 * Sanitize an array by removing null/undefined values
 *
 * @param input - Array to sanitize
 * @returns Sanitized array
 */
export function sanitizeArray<T>(input: (T | null | undefined)[]): T[] {
  return input.filter((item): item is T => item != null);
}

// ==========================================
// TYPE COERCION
// ==========================================

/**
 * Coerce input to number
 *
 * @param input - Input to coerce
 * @returns Number or undefined if coercion fails
 */
export function coerceToNumber(input: unknown): number | undefined {
  // Only coerce numbers and strings - reject everything else
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : undefined;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  }
  // Reject booleans, arrays, objects, etc.
  return undefined;
}

/**
 * Coerce input to integer
 *
 * @param input - Input to coerce
 * @returns Integer or undefined if coercion fails
 */
export function coerceToInteger(input: unknown): number | undefined {
  // Only coerce if input is number or string
  if (typeof input !== 'number' && typeof input !== 'string') {
    return undefined;
  }

  // If it's a string, reject if it contains a decimal point
  if (typeof input === 'string' && input.includes('.')) {
    return undefined;
  }

  const num = coerceToNumber(input);
  if (num === undefined) return undefined;

  // Check if the number is already an integer
  if (!Number.isInteger(num)) {
    return undefined;
  }

  return num;
}

/**
 * Coerce input to string
 *
 * @param input - Input to coerce
 * @returns String or undefined if input is null/undefined/array/object
 */
export function coerceToString(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === 'string') return input;
  // Only coerce numbers - reject arrays, objects, etc.
  if (typeof input === 'number') return String(input);
  // Reject arrays, objects, functions, etc.
  return undefined;
}

/**
 * Coerce input to uppercase string
 *
 * @param input - Input to coerce
 * @returns Uppercase string or undefined
 */
export function coerceToUppercase(input: unknown): string | undefined {
  const str = coerceToString(input);
  return str?.toUpperCase();
}

/**
 * Coerce input to array
 *
 * @param input - Input to coerce
 * @returns Array (wraps single values, returns arrays as-is)
 */
export function coerceToArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

// ==========================================
// RUNTIME TYPE GUARDS
// ==========================================

/**
 * Runtime type guard for Season type
 *
 * @param value - Value to check
 * @returns True if value is a valid Season
 */
export function isSeasonType(value: unknown): value is Season {
  return typeof value === 'number' && isValidSeason(value);
}

/**
 * Runtime type guard for Week type
 *
 * @param value - Value to check
 * @param seasonType - Season type for context
 * @returns True if value is a valid Week
 */
export function isWeekType(value: unknown, seasonType?: SeasonType): value is Week {
  return typeof value === 'number' && isValidWeek(value, seasonType);
}

/**
 * Runtime type guard for TeamAbbr type
 *
 * @param value - Value to check
 * @returns True if value is a valid TeamAbbr
 */
export function isTeamAbbrType(value: unknown): value is TeamAbbr {
  return typeof value === 'string' && isValidTeam(value);
}

/**
 * Runtime type guard for AnyTeamAbbr type (including historical)
 *
 * @param value - Value to check
 * @returns True if value is a valid AnyTeamAbbr
 */
export function isAnyTeamAbbrType(value: unknown): value is AnyTeamAbbr {
  return typeof value === 'string' && isValidTeamOrHistorical(value);
}

/**
 * Runtime type guard for SeasonType type
 *
 * @param value - Value to check
 * @returns True if value is a valid SeasonType
 */
export function isSeasonTypeType(value: unknown): value is SeasonType {
  return typeof value === 'string' && isValidSeasonType(value);
}

/**
 * Runtime type guard for non-empty string
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Runtime type guard for positive integer
 *
 * @param value - Value to check
 * @returns True if value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Runtime type guard for non-negative integer
 *
 * @param value - Value to check
 * @returns True if value is a non-negative integer (0 or positive)
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// ==========================================
// COMPOSITE VALIDATORS
// ==========================================

/**
 * Validate and coerce season input
 *
 * @param input - Season input (number or string)
 * @param options - Validation options
 * @returns Validation result with coerced season
 *
 * @example
 * ```typescript
 * const result = validateSeason('2023');
 * if (result.valid) {
 *   console.log(result.value); // 2023 (as number)
 * }
 * ```
 */
export function validateSeason(
  input: unknown,
  options: SeasonValidationOptions = {}
): ValidationResult<Season> {
  const { minSeason = MIN_SEASON, allowFuture = true, coerce = true } = options;

  // Coerce to number if requested
  const coercedValue = coerce ? coerceToInteger(input) : (input as number);

  // Check if coercion succeeded
  if (coercedValue === undefined || !Number.isInteger(coercedValue)) {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid season value: ${String(input)}. Must be a valid integer.`,
        ErrorCode.INVALID_SEASON,
        { input, minSeason }
      ),
    };
  }

  // Type narrowing: coercedValue is now definitely a number
  const value: number = coercedValue;

  // Determine max season
  const currentSeason = getCurrentSeason();
  const maxSeason = options.maxSeason ?? (allowFuture ? currentSeason + 1 : currentSeason);

  // Validate range using the provided min/max bounds
  // Don't use isValidSeason() here as it enforces MIN_SEASON (1999),
  // but some data sources (like rosters) go back to 1920
  if (value < minSeason || value > maxSeason) {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid season: ${value}. Must be between ${minSeason} and ${maxSeason}.`,
        ErrorCode.INVALID_SEASON,
        { season: value, minSeason, maxSeason }
      ),
    };
  }

  return { valid: true, value };
}

/**
 * Validate and coerce week input
 *
 * @param input - Week input (number or string)
 * @param options - Validation options
 * @returns Validation result with coerced week
 *
 * @example
 * ```typescript
 * const result = validateWeek('5', { seasonType: 'REG' });
 * if (result.valid) {
 *   console.log(result.value); // 5 (as number)
 * }
 * ```
 */
export function validateWeek(
  input: unknown,
  options: WeekValidationOptions = {}
): ValidationResult<Week> {
  const { seasonType = 'REG', coerce = true } = options;

  // Coerce to number if requested
  const coercedValue = coerce ? coerceToInteger(input) : (input as number);

  // Check if coercion succeeded
  if (coercedValue === undefined || !Number.isInteger(coercedValue)) {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid week value: ${String(input)}. Must be a valid integer.`,
        ErrorCode.INVALID_WEEK,
        { input, seasonType }
      ),
    };
  }

  // Type narrowing: coercedValue is now definitely a number
  const value: number = coercedValue;

  // Validate based on season type
  if (!isValidWeek(value, seasonType)) {
    const maxWeek =
      seasonType === 'REG' ? MAX_REGULAR_SEASON_WEEK : seasonType === 'POST' ? MAX_PLAYOFF_WEEK : 4;

    return {
      valid: false,
      error: new ValidationError(
        `Invalid week: ${String(value)} for season type ${seasonType}. Must be between 1 and ${maxWeek}.`,
        ErrorCode.INVALID_WEEK,
        { week: value, seasonType, maxWeek }
      ),
    };
  }

  return { valid: true, value };
}

/**
 * Validate and normalize team abbreviation
 *
 * @param input - Team abbreviation input
 * @param options - Validation options
 * @returns Validation result with normalized team abbreviation
 *
 * @example
 * ```typescript
 * const result = validateTeam('kc', { normalize: true });
 * if (result.valid) {
 *   console.log(result.value); // 'KC'
 * }
 * ```
 */
export function validateTeam(
  input: unknown,
  options: TeamValidationOptions = {}
): ValidationResult<TeamAbbr> {
  const { allowHistorical = true, normalize = true, coerce = true } = options;

  // Coerce to string if requested
  const coercedValue = coerce ? coerceToString(input) : (input as string);

  // Check if coercion succeeded
  if (!coercedValue || typeof coercedValue !== 'string' || coercedValue.trim() === '') {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid team value: ${String(input)}. Must be a non-empty string.`,
        ErrorCode.INVALID_TEAM,
        { input }
      ),
    };
  }

  // Type narrowing: coercedValue is now definitely a string
  let value: string = coercedValue;

  // Normalize if requested
  if (normalize) {
    value = normalizeTeamAbbr(value);
  } else if (coerce) {
    value = value.toUpperCase().trim();
  }

  // Validate team
  const isValid = allowHistorical ? isValidTeamOrHistorical(value) : isValidTeam(value);

  if (!isValid) {
    return {
      valid: false,
      error: new ValidationError(`Invalid team abbreviation: ${value}.`, ErrorCode.INVALID_TEAM, {
        team: value,
        allowHistorical,
      }),
    };
  }

  return { valid: true, value };
}

/**
 * Validate season type
 *
 * @param input - Season type input
 * @param coerce - Whether to coerce to uppercase
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateSeasonTypeInput('reg', true);
 * if (result.valid) {
 *   console.log(result.value); // 'REG'
 * }
 * ```
 */
export function validateSeasonTypeInput(
  input: unknown,
  coerce = true
): ValidationResult<SeasonType> {
  // Coerce to uppercase if requested
  const coercedValue = coerce ? coerceToUppercase(input) : (input as string);

  // Check if coercion succeeded
  if (!coercedValue || typeof coercedValue !== 'string') {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid season type: ${String(input)}. Must be a string.`,
        ErrorCode.INVALID_PARAMETER,
        { input }
      ),
    };
  }

  // Type narrowing: coercedValue is now definitely a string
  const value: string = coercedValue;

  // Validate
  if (!isValidSeasonType(value)) {
    return {
      valid: false,
      error: new ValidationError(
        `Invalid season type: ${value}. Must be one of: REG, POST, PRE.`,
        ErrorCode.INVALID_PARAMETER,
        { seasonType: value }
      ),
    };
  }

  return { valid: true, value };
}

/**
 * Validate array of seasons
 *
 * @param input - Array of seasons or single season
 * @param seasonOptions - Season validation options
 * @param arrayOptions - Array validation options
 * @returns Validation result with array of validated seasons
 *
 * @example
 * ```typescript
 * const result = validateSeasons([2022, 2023, 2024]);
 * if (result.valid) {
 *   console.log(result.value); // [2022, 2023, 2024]
 * }
 * ```
 */
export function validateSeasons(
  input: unknown,
  seasonOptions: SeasonValidationOptions = {},
  arrayOptions: ArrayValidationOptions = {}
): ValidationResult<Season[]> {
  const { minLength = 1, maxLength, unique = true } = arrayOptions;

  // Coerce to array
  const inputArray = Array.isArray(input) ? input : [input];

  // Validate length
  if (inputArray.length < minLength) {
    return {
      valid: false,
      error: new ValidationError(
        `Array must have at least ${minLength} element(s).`,
        ErrorCode.INVALID_PARAMETER,
        { input, minLength }
      ),
    };
  }

  if (maxLength !== undefined && inputArray.length > maxLength) {
    return {
      valid: false,
      error: new ValidationError(
        `Array must have at most ${maxLength} element(s).`,
        ErrorCode.INVALID_PARAMETER,
        { input, maxLength }
      ),
    };
  }

  // Validate each season
  const validSeasons: Season[] = [];
  for (const item of inputArray) {
    const result = validateSeason(item, seasonOptions);
    if (!result.valid) {
      return { valid: false, error: result.error! };
    }
    validSeasons.push(result.value!);
  }

  // Remove duplicates if requested
  const finalSeasons = unique ? Array.from(new Set(validSeasons)) : validSeasons;

  return { valid: true, value: finalSeasons };
}

/**
 * Validate array of teams
 *
 * @param input - Array of teams or single team
 * @param teamOptions - Team validation options
 * @param arrayOptions - Array validation options
 * @returns Validation result with array of validated teams
 *
 * @example
 * ```typescript
 * const result = validateTeams(['KC', 'SF', 'BUF']);
 * if (result.valid) {
 *   console.log(result.value); // ['KC', 'SF', 'BUF']
 * }
 * ```
 */
export function validateTeams(
  input: unknown,
  teamOptions: TeamValidationOptions = {},
  arrayOptions: ArrayValidationOptions = {}
): ValidationResult<TeamAbbr[]> {
  const { minLength = 1, maxLength, unique = true } = arrayOptions;

  // Coerce to array
  const inputArray = Array.isArray(input) ? input : [input];

  // Validate length
  if (inputArray.length < minLength) {
    return {
      valid: false,
      error: new ValidationError(
        `Array must have at least ${minLength} element(s).`,
        ErrorCode.INVALID_PARAMETER,
        { input, minLength }
      ),
    };
  }

  if (maxLength !== undefined && inputArray.length > maxLength) {
    return {
      valid: false,
      error: new ValidationError(
        `Array must have at most ${maxLength} element(s).`,
        ErrorCode.INVALID_PARAMETER,
        { input, maxLength }
      ),
    };
  }

  // Validate each team
  const validTeams: TeamAbbr[] = [];
  for (const item of inputArray) {
    const result = validateTeam(item, teamOptions);
    if (!result.valid) {
      return { valid: false, error: result.error! };
    }
    validTeams.push(result.value!);
  }

  // Remove duplicates if requested
  const finalTeams = unique ? Array.from(new Set(validTeams)) : validTeams;

  return { valid: true, value: finalTeams };
}

// ==========================================
// RE-EXPORT EXISTING VALIDATORS
// ==========================================

export {
  // Assert functions (throw on invalid)
  assertValidSeason,
  assertValidSeasonType,
  assertValidTeam,
  assertValidWeek,
  // Type guards
  isValidSeason,
  isValidSeasonType,
  isValidTeam,
  isValidTeamOrHistorical,
  isValidWeek,
  // Normalization
  normalizeTeamAbbr,
};
