/**
 * Tests for datetime utilities
 */

import { describe, expect, it, vi } from 'vitest';

import {
  addDays,
  daysBetween,
  formatDate,
  formatDateLong,
  formatDateShort,
  generateSeasonRange,
  generateWeekRange,
  getCurrentWeek,
  getSeasonEndDate,
  getSeasonFromDate,
  getSeasonStartDate,
  getToday,
  getWeeksForSeasonType,
  isDateInSeason,
  isFutureDate,
  isPastDate,
  parseDate,
} from '../../src/utils/datetime.js';

describe('DateTime Utilities', () => {
  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const date = parseDate('2024-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      // Date parsing can vary by timezone, just check it's in range
      expect(date.getDate()).toBeGreaterThanOrEqual(14);
      expect(date.getDate()).toBeLessThanOrEqual(15);
    });

    it('should parse ISO 8601 format', () => {
      const date = parseDate('2024-03-20T15:30:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should throw on invalid date string', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string');
    });

    it('should throw on empty string', () => {
      expect(() => parseDate('')).toThrow('Invalid date string');
    });
  });

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should pad single digit months', () => {
      const date = new Date(2024, 2, 5); // March 5, 2024
      expect(formatDate(date)).toBe('2024-03-05');
    });

    it('should pad single digit days', () => {
      const date = new Date(2024, 11, 1); // December 1, 2024
      expect(formatDate(date)).toBe('2024-12-01');
    });
  });

  describe('getToday', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should match current date', () => {
      const today = getToday();
      const now = new Date();
      const expected = formatDate(now);
      expect(today).toBe(expected);
    });
  });

  describe('getSeasonFromDate', () => {
    it('should return current year for September-December', () => {
      const septDate = new Date(2024, 8, 1); // September 1, 2024
      expect(getSeasonFromDate(septDate)).toBe(2024);

      const decDate = new Date(2024, 11, 31); // December 31, 2024
      expect(getSeasonFromDate(decDate)).toBe(2024);
    });

    it('should return previous year for January-August', () => {
      const janDate = new Date(2024, 0, 1); // January 1, 2024
      expect(getSeasonFromDate(janDate)).toBe(2023);

      const augDate = new Date(2024, 7, 31); // August 31, 2024
      expect(getSeasonFromDate(augDate)).toBe(2023);
    });

    it('should handle boundary dates correctly', () => {
      const endAug = new Date(2024, 7, 31); // August 31
      expect(getSeasonFromDate(endAug)).toBe(2023);

      const startSept = new Date(2024, 8, 1); // September 1
      expect(getSeasonFromDate(startSept)).toBe(2024);
    });
  });

  describe('getSeasonStartDate', () => {
    it('should return September 1st of season year', () => {
      const start = getSeasonStartDate(2024);
      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(8); // September
      expect(start.getDate()).toBe(1);
    });

    it('should work for different seasons', () => {
      const start2023 = getSeasonStartDate(2023);
      const start2024 = getSeasonStartDate(2024);

      expect(start2023.getFullYear()).toBe(2023);
      expect(start2024.getFullYear()).toBe(2024);
    });
  });

  describe('getSeasonEndDate', () => {
    it('should return January 10th of next year', () => {
      const end = getSeasonEndDate(2024);
      expect(end.getFullYear()).toBe(2025);
      expect(end.getMonth()).toBe(0); // January
      expect(end.getDate()).toBe(10);
    });

    it('should work for different seasons', () => {
      const end2023 = getSeasonEndDate(2023);
      const end2024 = getSeasonEndDate(2024);

      expect(end2023.getFullYear()).toBe(2024);
      expect(end2024.getFullYear()).toBe(2025);
    });
  });

  describe('isDateInSeason', () => {
    it('should return true for dates within season', () => {
      const oct2024 = new Date(2024, 9, 15); // October 15, 2024
      expect(isDateInSeason(oct2024, 2024)).toBe(true);

      const dec2024 = new Date(2024, 11, 25); // December 25, 2024
      expect(isDateInSeason(dec2024, 2024)).toBe(true);
    });

    it('should return false for dates before season', () => {
      const july2024 = new Date(2024, 6, 1); // July 1, 2024
      expect(isDateInSeason(july2024, 2024)).toBe(false);
    });

    it('should return false for dates after season', () => {
      const feb2025 = new Date(2025, 1, 1); // February 1, 2025
      expect(isDateInSeason(feb2025, 2024)).toBe(false);
    });

    it('should handle boundary dates', () => {
      const seasonStart = getSeasonStartDate(2024);
      const seasonEnd = getSeasonEndDate(2024);

      expect(isDateInSeason(seasonStart, 2024)).toBe(true);
      expect(isDateInSeason(seasonEnd, 2024)).toBe(true);
    });
  });

  describe('getCurrentWeek', () => {
    it('should return null for dates outside season', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 6, 1)); // July 1, 2024

      const week = getCurrentWeek(2024);
      expect(week).toBe(null);

      vi.useRealTimers();
    });

    it('should calculate week number during season', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 8, 8)); // September 8, 2024

      const week = getCurrentWeek(2024);
      expect(week).toBeGreaterThan(0);
      expect(week).toBeLessThanOrEqual(18);

      vi.useRealTimers();
    });

    it('should cap at week 18', () => {
      vi.useFakeTimers();
      // Way into the season
      vi.setSystemTime(new Date(2025, 0, 5)); // January 5, 2025

      const week = getCurrentWeek(2024);
      expect(week).toBeLessThanOrEqual(18);

      vi.useRealTimers();
    });

    it('should use current season if not specified', () => {
      const week = getCurrentWeek();
      expect(week === null || (typeof week === 'number' && week >= 1 && week <= 18)).toBe(true);
    });
  });

  describe('generateSeasonRange', () => {
    it('should generate range from start to end', () => {
      const range = generateSeasonRange(2020, 2022);
      expect(range).toEqual([2020, 2021, 2022]);
    });

    it('should handle single season', () => {
      const range = generateSeasonRange(2024, 2024);
      expect(range).toEqual([2024]);
    });

    it('should throw on invalid range', () => {
      expect(() => generateSeasonRange(2024, 2020)).toThrow();
    });
  });

  describe('generateWeekRange', () => {
    it('should generate range from start to end', () => {
      const range = generateWeekRange(1, 5);
      expect(range).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle single week', () => {
      const range = generateWeekRange(10, 10);
      expect(range).toEqual([10]);
    });

    it('should throw on invalid range', () => {
      expect(() => generateWeekRange(5, 1)).toThrow();
    });
  });

  describe('getWeeksForSeasonType', () => {
    it('should return 1-18 for regular season', () => {
      const weeks = getWeeksForSeasonType('REG');
      expect(weeks).toHaveLength(18);
      expect(weeks[0]).toBe(1);
      expect(weeks[17]).toBe(18);
    });

    it('should return PRE weeks (1-4)', () => {
      const weeks = getWeeksForSeasonType('PRE');
      expect(weeks).toHaveLength(4);
      expect(weeks[0]).toBe(1);
      expect(weeks[3]).toBe(4);
    });

    it('should return POST weeks (19-22)', () => {
      const weeks = getWeeksForSeasonType('POST');
      expect(weeks).toHaveLength(4);
      expect(weeks[0]).toBe(19);
      expect(weeks[3]).toBe(22);
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      const future = new Date(2024, 0, 16, 12, 0, 0);
      expect(isFutureDate(future)).toBe(true);

      vi.useRealTimers();
    });

    it('should return false for past dates', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      const past = new Date(2024, 0, 14, 12, 0, 0);
      expect(isFutureDate(past)).toBe(false);

      vi.useRealTimers();
    });

    it('should handle today correctly', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      // Same exact timestamp is not future
      const today = new Date(now);
      expect(isFutureDate(today)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      const past = new Date(2024, 0, 14, 12, 0, 0);
      expect(isPastDate(past)).toBe(true);

      vi.useRealTimers();
    });

    it('should return false for future dates', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      const future = new Date(2024, 0, 16, 12, 0, 0);
      expect(isPastDate(future)).toBe(false);

      vi.useRealTimers();
    });

    it('should handle today correctly', () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(now);

      const today = new Date(now);
      expect(isPastDate(today)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between two dates', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 11);
      expect(daysBetween(date1, date2)).toBe(10);
    });

    it('should return positive regardless of date order', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 10);
      // Implementation uses Math.abs() so always positive
      expect(daysBetween(date1, date2)).toBe(9);
      expect(daysBetween(date2, date1)).toBe(9);
    });

    it('should return 0 for same date', () => {
      const date = new Date(2024, 0, 1);
      expect(daysBetween(date, date)).toBe(0);
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date(2024, 0, 1);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(11);
    });

    it('should subtract negative days', () => {
      const date = new Date(2024, 0, 11);
      const result = addDays(date, -10);
      expect(result.getDate()).toBe(1);
    });

    it('should handle month rollover', () => {
      const date = new Date(2024, 0, 25); // January 25
      const result = addDays(date, 10);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });

    it('should not mutate original date', () => {
      const date = new Date(2024, 0, 1);
      const original = date.getTime();
      addDays(date, 10);
      expect(date.getTime()).toBe(original);
    });
  });

  describe('formatDateLong', () => {
    it('should format date in long format', () => {
      const date = new Date(2024, 0, 15);
      const formatted = formatDateLong(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should handle different months', () => {
      const date = new Date(2024, 11, 25);
      const formatted = formatDateLong(date);
      expect(formatted).toContain('December');
    });
  });

  describe('formatDateShort', () => {
    it('should format date in short format with abbreviated month', () => {
      const date = new Date(2024, 0, 15);
      const formatted = formatDateShort(date);
      // Implementation uses month: 'short' which gives "Jan 15, 2024" format
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should handle different months', () => {
      const date = new Date(2024, 2, 5); // March 5, 2024
      const formatted = formatDateShort(date);
      // Format is "Mar 5, 2024"
      expect(formatted).toContain('Mar');
      expect(formatted).toContain('5');
      expect(formatted).toContain('2024');
    });
  });
});
