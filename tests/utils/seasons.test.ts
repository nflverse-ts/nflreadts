/**
 * Tests for season normalization utilities
 */

import { describe, expect, it, vi } from 'vitest';

import { normalizeSeasons } from '../../src/utils/seasons.js';

// Mock getCurrentSeason
vi.mock('../../src/utils/datetime.js', () => ({
  getCurrentSeason: vi.fn(() => 2024),
}));

describe('normalizeSeasons', () => {
  describe('default behavior', () => {
    it('should return current season when undefined', () => {
      const result = normalizeSeasons();
      expect(result).toEqual([2024]);
    });

    it('should return single season as array', () => {
      const result = normalizeSeasons(2023);
      expect(result).toEqual([2023]);
    });

    it('should return array as-is', () => {
      const result = normalizeSeasons([2022, 2023]);
      expect(result).toEqual([2022, 2023]);
    });

    it('should return all seasons from 1999 to current when true', () => {
      const result = normalizeSeasons(true);
      expect(result[0]).toBe(1999);
      expect(result[result.length - 1]).toBe(2024);
      expect(result.length).toBe(2024 - 1999 + 1); // 26 seasons
    });
  });

  describe('custom minSeason', () => {
    it('should use custom minSeason for true', () => {
      const result = normalizeSeasons(true, { minSeason: 1920 });
      expect(result[0]).toBe(1920);
      expect(result[result.length - 1]).toBe(2024);
      expect(result.length).toBe(2024 - 1920 + 1); // 105 seasons
    });

    it('should use custom minSeason for participation data', () => {
      const result = normalizeSeasons(true, { minSeason: 2016 });
      expect(result[0]).toBe(2016);
      expect(result[result.length - 1]).toBe(2024);
      expect(result.length).toBe(2024 - 2016 + 1); // 9 seasons
    });

    it('should use custom minSeason for depth charts', () => {
      const result = normalizeSeasons(true, { minSeason: 2001 });
      expect(result[0]).toBe(2001);
      expect(result[result.length - 1]).toBe(2024);
      expect(result.length).toBe(2024 - 2001 + 1); // 24 seasons
    });
  });

  describe('custom maxSeason', () => {
    it('should use custom maxSeason', () => {
      const result = normalizeSeasons(true, { maxSeason: 2020 });
      expect(result[0]).toBe(1999);
      expect(result[result.length - 1]).toBe(2020);
      expect(result.length).toBe(2020 - 1999 + 1); // 22 seasons
    });

    it('should work with both min and max', () => {
      const result = normalizeSeasons(true, { minSeason: 2010, maxSeason: 2015 });
      expect(result).toEqual([2010, 2011, 2012, 2013, 2014, 2015]);
    });

    it('should handle single year range', () => {
      const result = normalizeSeasons(true, { minSeason: 2020, maxSeason: 2020 });
      expect(result).toEqual([2020]);
    });
  });

  describe('custom defaultSeason', () => {
    it('should use custom defaultSeason when undefined', () => {
      const result = normalizeSeasons(undefined, { defaultSeason: 2020 });
      expect(result).toEqual([2020]);
    });

    it('should not affect single season input', () => {
      const result = normalizeSeasons(2023, { defaultSeason: 2020 });
      expect(result).toEqual([2023]);
    });

    it('should not affect array input', () => {
      const result = normalizeSeasons([2022, 2023], { defaultSeason: 2020 });
      expect(result).toEqual([2022, 2023]);
    });

    it('should not affect true input', () => {
      const result = normalizeSeasons(true, { defaultSeason: 2020 });
      expect(result[0]).toBe(1999); // Still uses minSeason default
    });
  });

  describe('combined options', () => {
    it('should handle all options together for undefined input', () => {
      const result = normalizeSeasons(undefined, {
        minSeason: 2000,
        maxSeason: 2020,
        defaultSeason: 2015,
      });
      expect(result).toEqual([2015]);
    });

    it('should handle all options together for true input', () => {
      const result = normalizeSeasons(true, {
        minSeason: 2010,
        maxSeason: 2015,
        defaultSeason: 2012, // Shouldn't affect true
      });
      expect(result).toEqual([2010, 2011, 2012, 2013, 2014, 2015]);
    });
  });

  describe('array generation performance', () => {
    it('should generate large season ranges efficiently', () => {
      const start = Date.now();
      const result = normalizeSeasons(true, { minSeason: 1920, maxSeason: 2024 });
      const end = Date.now();

      expect(result.length).toBe(105);
      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    it('should pre-allocate array with correct size', () => {
      const result = normalizeSeasons(true, { minSeason: 2000, maxSeason: 2010 });
      expect(result.length).toBe(11);
      // Verify all elements are populated (no undefined)
      expect(result.every((s) => typeof s === 'number')).toBe(true);
    });

    it('should generate sequential years correctly', () => {
      const result = normalizeSeasons(true, { minSeason: 2020, maxSeason: 2024 });
      expect(result).toEqual([2020, 2021, 2022, 2023, 2024]);
      // Verify sequence is correct
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBe(result[i - 1]! + 1);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = normalizeSeasons([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = normalizeSeasons([2023]);
      expect(result).toEqual([2023]);
    });

    it('should not sort or modify input array', () => {
      const input = [2023, 2021, 2022];
      const result = normalizeSeasons(input);
      expect(result).toEqual([2023, 2021, 2022]);
    });

    it('should handle very old seasons', () => {
      const result = normalizeSeasons(1920);
      expect(result).toEqual([1920]);
    });

    it('should handle future seasons (no validation in this function)', () => {
      const result = normalizeSeasons(2050);
      expect(result).toEqual([2050]);
    });
  });

  describe('type coercion', () => {
    it('should handle Season type correctly', () => {
      const season: number = 2023;
      const result = normalizeSeasons(season);
      expect(result).toEqual([2023]);
    });

    it('should handle array of Seasons correctly', () => {
      const seasons: number[] = [2022, 2023, 2024];
      const result = normalizeSeasons(seasons);
      expect(result).toEqual([2022, 2023, 2024]);
    });

    it('should handle boolean true correctly', () => {
      const allSeasons: boolean = true;
      const result = normalizeSeasons(allSeasons);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('real-world use cases', () => {
    it('should support PBP data loading (1999+)', () => {
      const result = normalizeSeasons(true); // Uses default minSeason of 1999
      expect(result[0]).toBe(1999);
    });

    it('should support participation data loading (2016+)', () => {
      const result = normalizeSeasons(true, { minSeason: 2016 });
      expect(result[0]).toBe(2016);
    });

    it('should support roster data loading (1920+)', () => {
      const result = normalizeSeasons(true, { minSeason: 1920 });
      expect(result[0]).toBe(1920);
      expect(result.length).toBeGreaterThan(100);
    });

    it('should support depth chart data loading (2001+)', () => {
      const result = normalizeSeasons(true, { minSeason: 2001 });
      expect(result[0]).toBe(2001);
    });

    it('should support loading last 3 seasons', () => {
      const result = normalizeSeasons([2022, 2023, 2024]);
      expect(result).toEqual([2022, 2023, 2024]);
    });

    it('should support loading specific historical season', () => {
      const result = normalizeSeasons(1985);
      expect(result).toEqual([1985]);
    });
  });

  describe('no options provided', () => {
    it('should use sensible defaults', () => {
      // No options = default behavior
      expect(normalizeSeasons()).toEqual([2024]); // current season
      expect(normalizeSeasons(2023)).toEqual([2023]);
      expect(normalizeSeasons([2022, 2023])).toEqual([2022, 2023]);

      const allSeasons = normalizeSeasons(true);
      expect(allSeasons[0]).toBe(1999); // default minSeason
      expect(allSeasons[allSeasons.length - 1]).toBe(2024); // default maxSeason
    });
  });
});
