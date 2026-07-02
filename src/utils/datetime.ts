/**
 * Date and time utilities for NFL data
 * @module utils/datetime
 */

import type { DateString, Season, Week } from '../types/common.js';

/**
 * Parse a date string in various formats to Date object
 * Throws an error if the date string is invalid
 *
 * @param dateString - Date string in ISO format (YYYY-MM-DD) or other valid formats
 * @returns Parsed Date object
 * @throws {Error} If the date string is invalid
 *
 * @example
 * ```typescript
 * parseDate('2023-09-07');
 * // Returns: Date object for September 7, 2023
 *
 * parseDate('invalid');
 * // Throws: Error: Invalid date string: invalid
 * ```
 */
export function parseDate(dateString: DateString): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * formatDate(new Date('2023-09-07'));
 * // Returns: '2023-09-07'
 * ```
 */
export function formatDate(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 *
 * @returns Today's date in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * getToday();
 * // Returns: '2023-09-07' (current date)
 * ```
 */
export function getToday(): DateString {
  return formatDate(new Date());
}

/**
 * Calculate the season from a date
 * NFL season runs from September (current year) to February (next year)
 *
 * @param date - Date to calculate season from
 * @returns NFL season year
 *
 * @example
 * ```typescript
 * getSeasonFromDate(new Date('2023-09-07')); // September 2023
 * // Returns: 2023
 *
 * getSeasonFromDate(new Date('2023-01-15')); // January 2023
 * // Returns: 2022 (previous year's season)
 * ```
 */
export function getSeasonFromDate(date: Date): Season {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // January-August: previous year's season
  // September-December: current year's season
  return month < 8 ? year - 1 : year;
}

/**
 * Get the current NFL season
 * Convenience function that returns the season for today's date
 *
 * @returns Current NFL season year
 *
 * @example
 * ```typescript
 * getCurrentSeason(); // Called in September 2023
 * // Returns: 2023
 *
 * getCurrentSeason(); // Called in January 2023
 * // Returns: 2022
 * ```
 */
export function getCurrentSeason(): Season {
  return getSeasonFromDate(new Date());
}

/**
 * Get the approximate start date of an NFL season
 * Regular season typically starts the first Thursday after Labor Day (first Monday in September)
 * This returns September 1st as an approximation
 *
 * @param season - NFL season year
 * @returns Approximate season start date (September 1st)
 *
 * @example
 * ```typescript
 * getSeasonStartDate(2023);
 * // Returns: Date object for September 1, 2023
 * ```
 */
export function getSeasonStartDate(season: Season): Date {
  // Approximate: first week of September
  return new Date(season, 8, 1); // Month is 0-indexed, so 8 = September
}

/**
 * Get the approximate end date of an NFL regular season
 * Regular season typically ends early January
 * This returns January 10th of the following year as an approximation
 *
 * @param season - NFL season year
 * @returns Approximate season end date (January 10th of next year)
 *
 * @example
 * ```typescript
 * getSeasonEndDate(2023);
 * // Returns: Date object for January 10, 2024
 * ```
 */
export function getSeasonEndDate(season: Season): Date {
  // Regular season ends in early January of the following year
  return new Date(season + 1, 0, 10); // January 10th of next year
}

/**
 * Check if a date falls within an NFL season
 * Uses approximate season start and end dates
 *
 * @param date - Date to check
 * @param season - NFL season year
 * @returns True if date falls within the season
 *
 * @example
 * ```typescript
 * isDateInSeason(new Date('2023-10-15'), 2023);
 * // Returns: true
 *
 * isDateInSeason(new Date('2023-02-15'), 2023);
 * // Returns: false (this is the 2022 season)
 * ```
 */
export function isDateInSeason(date: Date, season: Season): boolean {
  const start = getSeasonStartDate(season);
  const end = getSeasonEndDate(season);
  return date >= start && date <= end;
}

/**
 * Get the current NFL week based on date
 * This is an approximation based on typical NFL schedule
 * Returns null if the current date is not in the specified season
 *
 * @param season - NFL season year (defaults to current season)
 * @returns Current week number (1-18) or null if not in season
 *
 * @example
 * ```typescript
 * getCurrentWeek(2023); // Called during week 5 of 2023 season
 * // Returns: 5
 *
 * getCurrentWeek(2023); // Called during off-season
 * // Returns: null
 * ```
 */
export function getCurrentWeek(season?: Season): Week | null {
  const now = new Date();
  const currentSeason = season ?? getSeasonFromDate(now);

  // If we're not in the specified season, return null
  if (!isDateInSeason(now, currentSeason)) {
    return null;
  }

  const seasonStart = getSeasonStartDate(currentSeason);
  const daysSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Approximate week number (7 days per week, starting at week 1)
  const week = Math.floor(daysSinceStart / 7) + 1;

  // Cap at 18 weeks for regular season
  return Math.min(week, 18);
}

/**
 * Generate an array of seasons in a range
 *
 * @param startSeason - Starting season (inclusive)
 * @param endSeason - Ending season (inclusive)
 * @returns Array of seasons from start to end
 * @throws {Error} If start season is after end season
 *
 * @example
 * ```typescript
 * generateSeasonRange(2020, 2023);
 * // Returns: [2020, 2021, 2022, 2023]
 * ```
 */
export function generateSeasonRange(startSeason: Season, endSeason: Season): Season[] {
  if (startSeason > endSeason) {
    throw new Error('Start season must be before or equal to end season');
  }

  const seasons: Season[] = [];
  for (let season = startSeason; season <= endSeason; season++) {
    seasons.push(season);
  }
  return seasons;
}

/**
 * Generate an array of weeks in a range
 *
 * @param startWeek - Starting week (inclusive)
 * @param endWeek - Ending week (inclusive)
 * @returns Array of weeks from start to end
 * @throws {Error} If start week is after end week
 *
 * @example
 * ```typescript
 * generateWeekRange(1, 4);
 * // Returns: [1, 2, 3, 4]
 * ```
 */
export function generateWeekRange(startWeek: Week, endWeek: Week): Week[] {
  if (startWeek > endWeek) {
    throw new Error('Start week must be before or equal to end week');
  }

  const weeks: Week[] = [];
  for (let week = startWeek; week <= endWeek; week++) {
    weeks.push(week);
  }
  return weeks;
}

/**
 * Get all weeks for a season type
 *
 * @param seasonType - Type of season ('REG', 'POST', or 'PRE')
 * @returns Array of all weeks for that season type
 *
 * @example
 * ```typescript
 * getWeeksForSeasonType('REG');
 * // Returns: [1, 2, 3, ..., 18]
 *
 * getWeeksForSeasonType('POST');
 * // Returns: [19, 20, 21, 22]
 *
 * getWeeksForSeasonType('PRE');
 * // Returns: [1, 2, 3, 4]
 * ```
 */
export function getWeeksForSeasonType(seasonType: 'REG' | 'POST' | 'PRE'): Week[] {
  switch (seasonType) {
    case 'REG':
      return generateWeekRange(1 as Week, 18 as Week);
    case 'POST':
      return generateWeekRange(19 as Week, 22 as Week);
    case 'PRE':
      return generateWeekRange(1 as Week, 4 as Week);
    default:
      return [];
  }
}

/**
 * Check if a date is in the future
 *
 * @param date - Date to check
 * @returns True if date is after current time
 *
 * @example
 * ```typescript
 * isFutureDate(new Date('2099-01-01'));
 * // Returns: true
 *
 * isFutureDate(new Date('2000-01-01'));
 * // Returns: false
 * ```
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if a date is in the past
 *
 * @param date - Date to check
 * @returns True if date is before current time
 *
 * @example
 * ```typescript
 * isPastDate(new Date('2000-01-01'));
 * // Returns: true
 *
 * isPastDate(new Date('2099-01-01'));
 * // Returns: false
 * ```
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Get number of days between two dates
 * Returns the absolute difference
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between the dates (always positive)
 *
 * @example
 * ```typescript
 * daysBetween(new Date('2023-01-01'), new Date('2023-01-08'));
 * // Returns: 7
 * ```
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 * Returns a new Date object (does not modify the original)
 *
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 *
 * @example
 * ```typescript
 * addDays(new Date('2023-01-01'), 7);
 * // Returns: Date object for January 8, 2023
 *
 * addDays(new Date('2023-01-08'), -7);
 * // Returns: Date object for January 1, 2023
 * ```
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a date for display (e.g., "January 1, 2024")
 * Uses US English locale
 *
 * @param date - Date to format
 * @returns Formatted date string with full month name
 *
 * @example
 * ```typescript
 * formatDateLong(new Date('2024-01-01'));
 * // Returns: 'January 1, 2024'
 * ```
 */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date for display (e.g., "Jan 1, 2024")
 * Uses US English locale
 *
 * @param date - Date to format
 * @returns Formatted date string with abbreviated month name
 *
 * @example
 * ```typescript
 * formatDateShort(new Date('2024-01-01'));
 * // Returns: 'Jan 1, 2024'
 * ```
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
