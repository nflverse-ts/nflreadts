/**
 * Date and time utilities for NFL data
 * @module utils/datetime
 */

import type { DateString, Season, Week } from '../types/common.js';

/**
 * Parse a date string in various formats to Date object
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
 */
export function formatDate(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): DateString {
  return formatDate(new Date());
}

/**
 * Calculate the season from a date
 * NFL season runs from September (current year) to February (next year)
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
 */
export function getCurrentSeason(): Season {
  return getSeasonFromDate(new Date());
}

/**
 * Get the approximate start date of an NFL season
 * Regular season typically starts the first Thursday after Labor Day (first Monday in September)
 */
export function getSeasonStartDate(season: Season): Date {
  // Approximate: first week of September
  return new Date(season, 8, 1); // Month is 0-indexed, so 8 = September
}

/**
 * Get the approximate end date of an NFL regular season
 * Regular season typically ends early January
 */
export function getSeasonEndDate(season: Season): Date {
  // Regular season ends in early January of the following year
  return new Date(season + 1, 0, 10); // January 10th of next year
}

/**
 * Check if a date falls within an NFL season
 */
export function isDateInSeason(date: Date, season: Season): boolean {
  const start = getSeasonStartDate(season);
  const end = getSeasonEndDate(season);
  return date >= start && date <= end;
}

/**
 * Get the current NFL week based on date
 * This is an approximation based on typical NFL schedule
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
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Get number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a date for display (e.g., "January 1, 2024")
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
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
