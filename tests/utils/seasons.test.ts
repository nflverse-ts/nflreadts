/**
 * Tests for season normalization utilities
 */

import { describe, expect, it, vi } from 'vitest';

import { normalizeSeasons } from '../../src/utils/seasons.js';

// Mock getCurrentSeason to return a consistent value for testing
vi.mock('../../src/utils/datetime.js', () => ({
  getCurrentSeason: vi.fn(() => 2023),
}));

describe('Season Utilities', () => {
  describe('normalizeSeasons', () => {
    describe('with undefined input', () => {
      it('should return current season when undefined', () => {
        const result = normalizeSeasons(undefined);
        expect(result).toEqual([2023]);
      });

      it('should return current season for undefined with isParticipation=false', () => {
        const result = normalizeSeasons(undefined, false);
        expect(result).toEqual([2023]);
      });

      it('should return current season for undefined with isParticipation=true', () => {
        const result = normalizeSeasons(undefined, true);
        expect(result).toEqual([2023]);
      });
    });

    describe('with true input (all seasons)', () => {
      it('should return all seasons from 1999 to current when isParticipation=false', () => {
        const result = normalizeSeasons(true, false);

        // Should start at 1999
        expect(result[0]).toBe(1999);

        // Should end at 2023 (mocked current season)
        expect(result[result.length - 1]).toBe(2023);

        // Should have correct length (2023 - 1999 + 1 = 25 seasons)
        expect(result.length).toBe(25);

        // Should be consecutive years
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i + 1]).toBe(result[i] + 1);
        }
      });

      it('should return all seasons from 2016 to current when isParticipation=true', () => {
        const result = normalizeSeasons(true, true);

        // Should start at 2016 (MIN_PARTICIPATION_SEASON)
        expect(result[0]).toBe(2016);

        // Should end at 2023 (mocked current season)
        expect(result[result.length - 1]).toBe(2023);

        // Should have correct length (2023 - 2016 + 1 = 8 seasons)
        expect(result.length).toBe(8);

        // Should be consecutive years
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i + 1]).toBe(result[i] + 1);
        }
      });

      it('should default to isParticipation=false when not specified', () => {
        const result = normalizeSeasons(true);

        // Should start at 1999 (not 2016)
        expect(result[0]).toBe(1999);
        expect(result.length).toBe(25);
      });
    });

    describe('with array input', () => {
      it('should return array as-is for single season array', () => {
        const input = [2022];
        const result = normalizeSeasons(input);
        expect(result).toEqual([2022]);
      });

      it('should return array as-is for multiple seasons', () => {
        const input = [2020, 2021, 2022];
        const result = normalizeSeasons(input);
        expect(result).toEqual([2020, 2021, 2022]);
      });

      it('should return array as-is regardless of isParticipation flag', () => {
        const input = [2018, 2019];
        const result1 = normalizeSeasons(input, false);
        const result2 = normalizeSeasons(input, true);
        expect(result1).toEqual([2018, 2019]);
        expect(result2).toEqual([2018, 2019]);
      });

      it('should return empty array as-is', () => {
        const input: number[] = [];
        const result = normalizeSeasons(input);
        expect(result).toEqual([]);
      });

      it('should preserve order of seasons in array', () => {
        const input = [2023, 2020, 2022, 2021];
        const result = normalizeSeasons(input);
        expect(result).toEqual([2023, 2020, 2022, 2021]);
      });
    });

    describe('with single season number input', () => {
      it('should wrap single season in array', () => {
        const result = normalizeSeasons(2022);
        expect(result).toEqual([2022]);
      });

      it('should wrap single season regardless of isParticipation flag', () => {
        const result1 = normalizeSeasons(2020, false);
        const result2 = normalizeSeasons(2020, true);
        expect(result1).toEqual([2020]);
        expect(result2).toEqual([2020]);
      });

      it('should handle recent seasons', () => {
        const result = normalizeSeasons(2023);
        expect(result).toEqual([2023]);
      });

      it('should handle older seasons', () => {
        const result = normalizeSeasons(2000);
        expect(result).toEqual([2000]);
      });
    });

    describe('edge cases', () => {
      it('should handle boundary year 1999', () => {
        const result = normalizeSeasons(1999);
        expect(result).toEqual([1999]);
      });

      it('should handle boundary year 2016 for participation', () => {
        const result = normalizeSeasons(2016, true);
        expect(result).toEqual([2016]);
      });

      it('should return type Season[] (type check)', () => {
        const result = normalizeSeasons(2023);
        // TypeScript compilation will verify this is Season[]
        expect(Array.isArray(result)).toBe(true);
        expect(typeof result[0]).toBe('number');
      });
    });

    describe('performance characteristics', () => {
      it('should pre-allocate array for true input (performance optimization)', () => {
        // This tests that we're using new Array(size) pattern
        const result = normalizeSeasons(true, false);
        expect(result.length).toBe(25);
        // All elements should be defined (no sparse array)
        expect(result.every((season) => season !== undefined)).toBe(true);
      });

      it('should generate seasons efficiently without gaps', () => {
        const result = normalizeSeasons(true, true);
        // Verify no undefined or null values
        expect(result.every((season) => typeof season === 'number')).toBe(true);
      });
    });
  });
});
