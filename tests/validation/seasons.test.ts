/**
 * Tests for season validation
 */

import { describe, expect, it } from 'vitest';
import {
  assertValidSeason,
  isValidSeason,
  validateSeason,
  validateSeasons,
} from '../../src/validation/index.js';
import { MIN_SEASON } from '../../src/types/constants.js';
import { getCurrentSeason } from '../../src/utils/datetime.js';
import { ErrorCode, ValidationError } from '../../src/types/error.js';

describe('Season Validation', () => {
  const currentSeason = getCurrentSeason();

  describe('isValidSeason', () => {
    it('should accept valid current season', () => {
      expect(isValidSeason(currentSeason)).toBe(true);
    });

    it('should accept valid historical seasons', () => {
      expect(isValidSeason(1999)).toBe(true);
      expect(isValidSeason(2010)).toBe(true);
      expect(isValidSeason(2020)).toBe(true);
    });

    it('should accept next season', () => {
      expect(isValidSeason(currentSeason + 1)).toBe(true);
    });

    it('should reject seasons before MIN_SEASON', () => {
      expect(isValidSeason(MIN_SEASON - 1)).toBe(false);
      expect(isValidSeason(1990)).toBe(false);
      expect(isValidSeason(1800)).toBe(false);
    });

    it('should reject seasons too far in future', () => {
      expect(isValidSeason(currentSeason + 2)).toBe(false);
      expect(isValidSeason(currentSeason + 10)).toBe(false);
      expect(isValidSeason(3000)).toBe(false);
    });

    it('should reject non-integer numbers', () => {
      expect(isValidSeason(2023.5)).toBe(false);
      expect(isValidSeason(2023.1)).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(isValidSeason(-1)).toBe(false);
      expect(isValidSeason(-2023)).toBe(false);
    });

    it('should reject special numeric values', () => {
      expect(isValidSeason(NaN)).toBe(false);
      expect(isValidSeason(Infinity)).toBe(false);
      expect(isValidSeason(-Infinity)).toBe(false);
    });
  });

  describe('assertValidSeason', () => {
    it('should not throw for valid seasons', () => {
      expect(() => assertValidSeason(currentSeason)).not.toThrow();
      expect(() => assertValidSeason(2020)).not.toThrow();
      expect(() => assertValidSeason(MIN_SEASON)).not.toThrow();
    });

    it('should throw ValidationError for invalid seasons', () => {
      expect(() => assertValidSeason(1990)).toThrow(ValidationError);
      expect(() => assertValidSeason(currentSeason + 10)).toThrow(ValidationError);
    });

    it('should throw with correct error code', () => {
      try {
        assertValidSeason(1990);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_SEASON);
      }
    });

    it('should include context in error', () => {
      try {
        assertValidSeason(1990);
        expect.fail('Should have thrown');
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('season', 1990);
        expect(validationError.context).toHaveProperty('minSeason');
        expect(validationError.context).toHaveProperty('maxSeason');
      }
    });
  });

  describe('validateSeason (with coercion)', () => {
    it('should validate and return valid season', () => {
      const result = validateSeason(2023);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2023);
      expect(result.error).toBeUndefined();
    });

    it('should coerce string to number', () => {
      const result = validateSeason('2023', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2023);
    });

    it('should coerce string with whitespace', () => {
      const result = validateSeason('  2023  ', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2023);
    });

    it('should reject non-numeric strings', () => {
      const result = validateSeason('abc', { coerce: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should reject empty strings', () => {
      const result = validateSeason('', { coerce: true });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid season after coercion', () => {
      const result = validateSeason('1990', { coerce: true });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.INVALID_SEASON);
    });

    it('should respect minSeason option', () => {
      const result = validateSeason(2000, { minSeason: 2010 });
      expect(result.valid).toBe(false);
    });

    it('should respect maxSeason option', () => {
      const result = validateSeason(2025, { maxSeason: 2020 });
      expect(result.valid).toBe(false);
    });

    it('should respect allowFuture option', () => {
      const futureResult = validateSeason(currentSeason + 1, { allowFuture: false });
      expect(futureResult.valid).toBe(false);

      const allowedResult = validateSeason(currentSeason + 1, { allowFuture: true });
      expect(allowedResult.valid).toBe(true);
    });

    it('should handle coerce=false', () => {
      const result = validateSeason('2023', { coerce: false });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateSeasons (array)', () => {
    it('should validate array of seasons', () => {
      const result = validateSeasons([2020, 2021, 2022]);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([2020, 2021, 2022]);
    });

    it('should validate single season as array', () => {
      const result = validateSeasons(2023);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([2023]);
    });

    it('should remove duplicates by default', () => {
      const result = validateSeasons([2020, 2021, 2020, 2022, 2021]);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([2020, 2021, 2022]);
    });

    it('should keep duplicates when unique=false', () => {
      const result = validateSeasons([2020, 2021, 2020], {}, { unique: false });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([2020, 2021, 2020]);
    });

    it('should fail on first invalid season', () => {
      const result = validateSeasons([2020, 1990, 2022]);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.INVALID_SEASON);
    });

    it('should respect minLength option', () => {
      const result = validateSeasons([2020], {}, { minLength: 2 });
      expect(result.valid).toBe(false);
    });

    it('should respect maxLength option', () => {
      const result = validateSeasons([2020, 2021, 2022], {}, { maxLength: 2 });
      expect(result.valid).toBe(false);
    });

    it('should coerce string seasons in array', () => {
      const result = validateSeasons(['2020', '2021', '2022'], { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([2020, 2021, 2022]);
    });

    it('should handle mixed valid and invalid types', () => {
      const result = validateSeasons([2020, 'abc', 2022], { coerce: true });
      expect(result.valid).toBe(false);
    });

    it('should validate with season options', () => {
      const result = validateSeasons([2010, 2011], { minSeason: 2010, maxSeason: 2020 });
      expect(result.valid).toBe(true);

      const invalidResult = validateSeasons([2000, 2001], { minSeason: 2010 });
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary season values', () => {
      expect(isValidSeason(MIN_SEASON)).toBe(true);
      expect(isValidSeason(MIN_SEASON - 1)).toBe(false);

      expect(isValidSeason(currentSeason + 1)).toBe(true);
      expect(isValidSeason(currentSeason + 2)).toBe(false);
    });

    it('should handle zero', () => {
      expect(isValidSeason(0)).toBe(false);
      const result = validateSeason(0);
      expect(result.valid).toBe(false);
    });

    it('should handle very large numbers', () => {
      expect(isValidSeason(999999)).toBe(false);
      expect(isValidSeason(Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    it('should handle decimal seasons', () => {
      const result = validateSeason(2023.5);
      expect(result.valid).toBe(false);
    });

    it('should handle null and undefined', () => {
      const nullResult = validateSeason(null);
      expect(nullResult.valid).toBe(false);

      const undefinedResult = validateSeason(undefined);
      expect(undefinedResult.valid).toBe(false);
    });

    it('should handle objects and arrays', () => {
      const objectResult = validateSeason({});
      expect(objectResult.valid).toBe(false);

      const arrayResult = validateSeason([2023]);
      expect(arrayResult.valid).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle large arrays efficiently', () => {
      // Create array of valid seasons (last 25 years, repeated 4 times for 100 items)
      const recentSeasons = Array.from({ length: 25 }, (_, i) => currentSeason - i);
      const seasons = [...recentSeasons, ...recentSeasons, ...recentSeasons, ...recentSeasons];

      const start = Date.now();
      const result = validateSeasons(seasons);
      const duration = Date.now() - start;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });
});
