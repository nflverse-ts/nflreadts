/**
 * Tests for week validation
 */

import { describe, expect, it } from 'vitest';
import type { SeasonType } from '../../src/types/common.js';
import { MAX_PLAYOFF_WEEK, MAX_REGULAR_SEASON_WEEK } from '../../src/types/constants.js';
import { ErrorCode, ValidationError } from '../../src/types/error.js';
import { assertValidWeek, isValidWeek, validateWeek } from '../../src/validation/index.js';

describe('Week Validation', () => {
  describe('isValidWeek - Regular Season', () => {
    it('should accept valid regular season weeks', () => {
      expect(isValidWeek(1, 'REG')).toBe(true);
      expect(isValidWeek(9, 'REG')).toBe(true);
      expect(isValidWeek(MAX_REGULAR_SEASON_WEEK, 'REG')).toBe(true);
    });

    it('should reject week 0', () => {
      expect(isValidWeek(0, 'REG')).toBe(false);
    });

    it('should reject negative weeks', () => {
      expect(isValidWeek(-1, 'REG')).toBe(false);
      expect(isValidWeek(-10, 'REG')).toBe(false);
    });

    it('should reject weeks above maximum', () => {
      expect(isValidWeek(MAX_REGULAR_SEASON_WEEK + 1, 'REG')).toBe(false);
      expect(isValidWeek(19, 'REG')).toBe(false);
      expect(isValidWeek(100, 'REG')).toBe(false);
    });

    it('should reject non-integer weeks', () => {
      expect(isValidWeek(5.5, 'REG')).toBe(false);
      expect(isValidWeek(1.1, 'REG')).toBe(false);
    });

    it('should use REG as default season type', () => {
      expect(isValidWeek(1)).toBe(true);
      expect(isValidWeek(18)).toBe(true);
      expect(isValidWeek(19)).toBe(false);
    });
  });

  describe('isValidWeek - Postseason', () => {
    it('should accept valid postseason weeks', () => {
      expect(isValidWeek(19, 'POST')).toBe(true); // Wild Card
      expect(isValidWeek(20, 'POST')).toBe(true); // Divisional
      expect(isValidWeek(21, 'POST')).toBe(true); // Conference
      expect(isValidWeek(22, 'POST')).toBe(true); // Super Bowl
    });

    it('should reject regular season weeks for postseason', () => {
      expect(isValidWeek(1, 'POST')).toBe(false);
      expect(isValidWeek(10, 'POST')).toBe(false);
      expect(isValidWeek(18, 'POST')).toBe(false);
    });

    it('should reject weeks above maximum playoff week', () => {
      expect(isValidWeek(MAX_PLAYOFF_WEEK + 1, 'POST')).toBe(false);
      expect(isValidWeek(23, 'POST')).toBe(false);
    });
  });

  describe('isValidWeek - Preseason', () => {
    it('should accept valid preseason weeks', () => {
      expect(isValidWeek(1, 'PRE')).toBe(true);
      expect(isValidWeek(2, 'PRE')).toBe(true);
      expect(isValidWeek(3, 'PRE')).toBe(true);
      expect(isValidWeek(4, 'PRE')).toBe(true);
    });

    it('should reject week 0', () => {
      expect(isValidWeek(0, 'PRE')).toBe(false);
    });

    it('should reject weeks above 4', () => {
      expect(isValidWeek(5, 'PRE')).toBe(false);
      expect(isValidWeek(10, 'PRE')).toBe(false);
    });
  });

  describe('assertValidWeek', () => {
    it('should not throw for valid weeks', () => {
      expect(() => assertValidWeek(1, 'REG')).not.toThrow();
      expect(() => assertValidWeek(18, 'REG')).not.toThrow();
      expect(() => assertValidWeek(19, 'POST')).not.toThrow();
      expect(() => assertValidWeek(22, 'POST')).not.toThrow();
      expect(() => assertValidWeek(1, 'PRE')).not.toThrow();
      expect(() => assertValidWeek(4, 'PRE')).not.toThrow();
    });

    it('should use REG as default', () => {
      expect(() => assertValidWeek(1)).not.toThrow();
      expect(() => assertValidWeek(18)).not.toThrow();
      expect(() => assertValidWeek(19)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid weeks', () => {
      expect(() => assertValidWeek(0, 'REG')).toThrow(ValidationError);
      expect(() => assertValidWeek(19, 'REG')).toThrow(ValidationError);
      expect(() => assertValidWeek(1, 'POST')).toThrow(ValidationError);
      expect(() => assertValidWeek(23, 'POST')).toThrow(ValidationError);
      expect(() => assertValidWeek(5, 'PRE')).toThrow(ValidationError);
    });

    it('should throw with correct error code', () => {
      try {
        assertValidWeek(0, 'REG');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_WEEK);
      }
    });

    it('should include context in error', () => {
      try {
        assertValidWeek(19, 'REG');
        expect.fail('Should have thrown');
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('week', 19);
        expect(validationError.context).toHaveProperty('seasonType', 'REG');
        expect(validationError.context).toHaveProperty('maxWeek');
      }
    });
  });

  describe('validateWeek (with coercion)', () => {
    it('should validate and return valid week', () => {
      const result = validateWeek(5, { seasonType: 'REG' });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it('should use REG as default season type', () => {
      const result = validateWeek(10);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should coerce string to number', () => {
      const result = validateWeek('5', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should coerce string with whitespace', () => {
      const result = validateWeek('  10  ', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should reject non-numeric strings', () => {
      const result = validateWeek('abc', { coerce: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should reject empty strings', () => {
      const result = validateWeek('', { coerce: true });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid week after coercion', () => {
      const result = validateWeek('0', { coerce: true });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.INVALID_WEEK);
    });

    it('should validate postseason weeks correctly', () => {
      const validResult = validateWeek(19, { seasonType: 'POST' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validateWeek(1, { seasonType: 'POST' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate preseason weeks correctly', () => {
      const validResult = validateWeek(3, { seasonType: 'PRE' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validateWeek(5, { seasonType: 'PRE' });
      expect(invalidResult.valid).toBe(false);
    });

    it('should handle coerce=false', () => {
      const result = validateWeek('5', { coerce: false });
      expect(result.valid).toBe(false);
    });

    it('should include proper error messages', () => {
      const result = validateWeek(19, { seasonType: 'REG' });
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('19');
      expect(result.error?.message).toContain('REG');
      expect(result.error?.message).toContain('18');
    });
  });

  describe('Week Ranges by Season Type', () => {
    const testCases: Array<{
      seasonType: SeasonType;
      validWeeks: number[];
      invalidWeeks: number[];
    }> = [
      {
        seasonType: 'REG',
        validWeeks: [1, 2, 9, 17, 18],
        invalidWeeks: [0, 19, 20, 21, 22, 23],
      },
      {
        seasonType: 'POST',
        validWeeks: [19, 20, 21, 22],
        invalidWeeks: [0, 1, 10, 18, 23, 30],
      },
      {
        seasonType: 'PRE',
        validWeeks: [1, 2, 3, 4],
        invalidWeeks: [0, 5, 10, 19],
      },
    ];

    testCases.forEach(({ seasonType, validWeeks, invalidWeeks }) => {
      describe(`${seasonType} season type`, () => {
        it('should accept valid weeks', () => {
          for (const week of validWeeks) {
            expect(isValidWeek(week, seasonType)).toBe(true);
          }
        });

        it('should reject invalid weeks', () => {
          for (const week of invalidWeeks) {
            expect(isValidWeek(week, seasonType)).toBe(false);
          }
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary values', () => {
      // Regular season boundaries
      expect(isValidWeek(1, 'REG')).toBe(true);
      expect(isValidWeek(0, 'REG')).toBe(false);
      expect(isValidWeek(MAX_REGULAR_SEASON_WEEK, 'REG')).toBe(true);
      expect(isValidWeek(MAX_REGULAR_SEASON_WEEK + 1, 'REG')).toBe(false);

      // Postseason boundaries
      expect(isValidWeek(18, 'POST')).toBe(false);
      expect(isValidWeek(19, 'POST')).toBe(true);
      expect(isValidWeek(MAX_PLAYOFF_WEEK, 'POST')).toBe(true);
      expect(isValidWeek(MAX_PLAYOFF_WEEK + 1, 'POST')).toBe(false);

      // Preseason boundaries
      expect(isValidWeek(1, 'PRE')).toBe(true);
      expect(isValidWeek(0, 'PRE')).toBe(false);
      expect(isValidWeek(4, 'PRE')).toBe(true);
      expect(isValidWeek(5, 'PRE')).toBe(false);
    });

    it('should handle special numeric values', () => {
      expect(isValidWeek(NaN, 'REG')).toBe(false);
      expect(isValidWeek(Infinity, 'REG')).toBe(false);
      expect(isValidWeek(-Infinity, 'REG')).toBe(false);
    });

    it('should handle decimal weeks', () => {
      expect(isValidWeek(5.5, 'REG')).toBe(false);
      expect(isValidWeek(1.1, 'PRE')).toBe(false);
      expect(isValidWeek(19.9, 'POST')).toBe(false);
    });

    it('should handle very large numbers', () => {
      expect(isValidWeek(999, 'REG')).toBe(false);
      expect(isValidWeek(Number.MAX_SAFE_INTEGER, 'REG')).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(isValidWeek(-1, 'REG')).toBe(false);
      expect(isValidWeek(-100, 'POST')).toBe(false);
    });

    it('should handle null and undefined', () => {
      const nullResult = validateWeek(null);
      expect(nullResult.valid).toBe(false);

      const undefinedResult = validateWeek(undefined);
      expect(undefinedResult.valid).toBe(false);
    });

    it('should handle objects and arrays', () => {
      const objectResult = validateWeek({});
      expect(objectResult.valid).toBe(false);

      const arrayResult = validateWeek([5]);
      expect(arrayResult.valid).toBe(false);
    });
  });

  describe('Type Coercion Edge Cases', () => {
    it('should handle numeric strings with leading zeros', () => {
      const result = validateWeek('05', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should handle strings with decimal points', () => {
      const result = validateWeek('5.0', { coerce: true });
      expect(result.valid).toBe(false); // 5.0 is not an integer
    });

    it('should reject boolean values', () => {
      const trueResult = validateWeek(true, { coerce: true });
      expect(trueResult.valid).toBe(false); // Booleans are not coerced

      const falseResult = validateWeek(false, { coerce: true });
      expect(falseResult.valid).toBe(false); // Booleans are not coerced
    });

    it('should handle string representations of special values', () => {
      expect(validateWeek('NaN', { coerce: true }).valid).toBe(false);
      expect(validateWeek('Infinity', { coerce: true }).valid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with complete validation pipeline', () => {
      const testWeeks = [
        { input: '5', seasonType: 'REG' as SeasonType, expected: 5, valid: true },
        { input: '19', seasonType: 'POST' as SeasonType, expected: 19, valid: true },
        { input: '3', seasonType: 'PRE' as SeasonType, expected: 3, valid: true },
        { input: '19', seasonType: 'REG' as SeasonType, expected: undefined, valid: false },
        { input: '0', seasonType: 'REG' as SeasonType, expected: undefined, valid: false },
      ];

      for (const { input, seasonType, expected, valid } of testWeeks) {
        const result = validateWeek(input, { seasonType, coerce: true });
        expect(result.valid).toBe(valid);
        if (valid) {
          expect(result.value).toBe(expected);
        }
      }
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error messages for each season type', () => {
      const regResult = validateWeek(19, { seasonType: 'REG' });
      expect(regResult.error?.message).toContain('REG');
      expect(regResult.error?.message).toContain('18');

      const postResult = validateWeek(5, { seasonType: 'POST' });
      expect(postResult.error?.message).toContain('POST');
      expect(postResult.error?.message).toContain('22');

      const preResult = validateWeek(5, { seasonType: 'PRE' });
      expect(preResult.error?.message).toContain('PRE');
      expect(preResult.error?.message).toContain('4');
    });
  });

  describe('Performance', () => {
    it('should validate weeks quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        isValidWeek(i % 25, 'REG');
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
