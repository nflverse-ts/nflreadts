/**
 * Tests for validation edge cases and cross-cutting concerns
 */

import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/types/error.js';
import {
  assertInRange,
  assertNonEmptyArray,
  assertOneOf,
  assertValidFormat,
  assertValidGameId,
  isInRange,
  isNonEmptyArray,
  isOneOf,
  isValidFormat,
  isValidGameId,
  isValidOptional,
  optional,
} from '../../src/utils/validation.js';
import {
  coerceToArray,
  coerceToInteger,
  coerceToNumber,
  coerceToString,
  coerceToUppercase,
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveInteger,
  sanitizeArray,
  sanitizeNumber,
  sanitizeString,
  validateSeason,
  validateTeam,
  validateWeek,
} from '../../src/validation/index.js';

describe('Validation Edge Cases', () => {
  describe('Type Coercion', () => {
    describe('coerceToNumber', () => {
      it('should handle valid numbers', () => {
        expect(coerceToNumber(42)).toBe(42);
        expect(coerceToNumber(3.14)).toBe(3.14);
        expect(coerceToNumber(0)).toBe(0);
        expect(coerceToNumber(-10)).toBe(-10);
      });

      it('should coerce numeric strings', () => {
        expect(coerceToNumber('42')).toBe(42);
        expect(coerceToNumber('3.14')).toBe(3.14);
        expect(coerceToNumber('  123  ')).toBe(123);
      });

      it('should return undefined for invalid inputs', () => {
        expect(coerceToNumber('abc')).toBeUndefined();
        expect(coerceToNumber('')).toBeUndefined();
        expect(coerceToNumber('  ')).toBeUndefined();
        expect(coerceToNumber(null)).toBeUndefined();
        expect(coerceToNumber(undefined)).toBeUndefined();
        expect(coerceToNumber({})).toBeUndefined();
        expect(coerceToNumber([])).toBeUndefined();
      });

      it('should return undefined for special values', () => {
        expect(coerceToNumber(NaN)).toBeUndefined();
        expect(coerceToNumber(Infinity)).toBeUndefined();
        expect(coerceToNumber(-Infinity)).toBeUndefined();
      });
    });

    describe('coerceToInteger', () => {
      it('should handle valid integers', () => {
        expect(coerceToInteger(42)).toBe(42);
        expect(coerceToInteger(0)).toBe(0);
        expect(coerceToInteger(-10)).toBe(-10);
      });

      it('should reject decimals', () => {
        expect(coerceToInteger(3.14)).toBeUndefined();
        expect(coerceToInteger(1.1)).toBeUndefined();
      });

      it('should coerce numeric strings to integers', () => {
        expect(coerceToInteger('42')).toBe(42);
        expect(coerceToInteger('  123  ')).toBe(123);
      });

      it('should reject decimal strings', () => {
        expect(coerceToInteger('3.14')).toBeUndefined();
      });

      it('should return undefined for invalid inputs', () => {
        expect(coerceToInteger('abc')).toBeUndefined();
        expect(coerceToInteger('')).toBeUndefined();
        expect(coerceToInteger(null)).toBeUndefined();
      });
    });

    describe('coerceToString', () => {
      it('should handle strings', () => {
        expect(coerceToString('hello')).toBe('hello');
        expect(coerceToString('')).toBe('');
      });

      it('should coerce numbers to strings', () => {
        expect(coerceToString(42)).toBe('42');
        expect(coerceToString(3.14)).toBe('3.14');
        expect(coerceToString(0)).toBe('0');
      });

      it('should return undefined for null/undefined', () => {
        expect(coerceToString(null)).toBeUndefined();
        expect(coerceToString(undefined)).toBeUndefined();
      });

      it('should reject booleans', () => {
        expect(coerceToString(true)).toBeUndefined();
        expect(coerceToString(false)).toBeUndefined();
      });

      it('should reject objects and arrays', () => {
        expect(coerceToString({})).toBeUndefined();
        expect(coerceToString([])).toBeUndefined();
      });
    });

    describe('coerceToUppercase', () => {
      it('should convert strings to uppercase', () => {
        expect(coerceToUppercase('hello')).toBe('HELLO');
        expect(coerceToUppercase('MiXeD')).toBe('MIXED');
      });

      it('should handle already uppercase', () => {
        expect(coerceToUppercase('HELLO')).toBe('HELLO');
      });

      it('should coerce and convert', () => {
        expect(coerceToUppercase(42)).toBe('42');
      });

      it('should return undefined for null/undefined', () => {
        expect(coerceToUppercase(null)).toBeUndefined();
        expect(coerceToUppercase(undefined)).toBeUndefined();
      });
    });

    describe('coerceToArray', () => {
      it('should wrap single values in array', () => {
        expect(coerceToArray(42)).toEqual([42]);
        expect(coerceToArray('hello')).toEqual(['hello']);
        expect(coerceToArray(null)).toEqual([null]);
      });

      it('should return arrays as-is', () => {
        expect(coerceToArray([1, 2, 3])).toEqual([1, 2, 3]);
        expect(coerceToArray([])).toEqual([]);
      });
    });
  });

  describe('Sanitization', () => {
    describe('sanitizeString', () => {
      it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
        expect(sanitizeString('\thello\n')).toBe('hello');
      });

      it('should handle already clean strings', () => {
        expect(sanitizeString('hello')).toBe('hello');
      });

      it('should handle empty strings', () => {
        expect(sanitizeString('')).toBe('');
        expect(sanitizeString('   ')).toBe('');
      });
    });

    describe('sanitizeNumber', () => {
      it('should pass through valid numbers', () => {
        expect(sanitizeNumber(42)).toBe(42);
        expect(sanitizeNumber(0)).toBe(0);
        expect(sanitizeNumber(-10)).toBe(-10);
        expect(sanitizeNumber(3.14)).toBe(3.14);
      });

      it('should return NaN for invalid numbers', () => {
        expect(sanitizeNumber(NaN)).toBeNaN();
        expect(sanitizeNumber(Infinity)).toBeNaN();
        expect(sanitizeNumber(-Infinity)).toBeNaN();
      });
    });

    describe('sanitizeArray', () => {
      it('should remove null and undefined', () => {
        expect(sanitizeArray([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
      });

      it('should keep other falsy values', () => {
        expect(sanitizeArray([0, false, '', NaN])).toEqual([0, false, '', NaN]);
      });

      it('should handle empty arrays', () => {
        expect(sanitizeArray([])).toEqual([]);
      });

      it('should handle all null/undefined', () => {
        expect(sanitizeArray([null, undefined, null])).toEqual([]);
      });
    });
  });

  describe('Runtime Type Guards', () => {
    describe('isNonEmptyString', () => {
      it('should accept non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString('a')).toBe(true);
      });

      it('should reject empty strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString('   ')).toBe(false);
      });

      it('should reject non-strings', () => {
        expect(isNonEmptyString(42)).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
      });
    });

    describe('isPositiveInteger', () => {
      it('should accept positive integers', () => {
        expect(isPositiveInteger(1)).toBe(true);
        expect(isPositiveInteger(42)).toBe(true);
        expect(isPositiveInteger(1000)).toBe(true);
      });

      it('should reject zero', () => {
        expect(isPositiveInteger(0)).toBe(false);
      });

      it('should reject negative numbers', () => {
        expect(isPositiveInteger(-1)).toBe(false);
        expect(isPositiveInteger(-42)).toBe(false);
      });

      it('should reject decimals', () => {
        expect(isPositiveInteger(3.14)).toBe(false);
        expect(isPositiveInteger(1.1)).toBe(false);
      });

      it('should reject non-numbers', () => {
        expect(isPositiveInteger('42')).toBe(false);
        expect(isPositiveInteger(null)).toBe(false);
      });
    });

    describe('isNonNegativeInteger', () => {
      it('should accept non-negative integers', () => {
        expect(isNonNegativeInteger(0)).toBe(true);
        expect(isNonNegativeInteger(1)).toBe(true);
        expect(isNonNegativeInteger(42)).toBe(true);
      });

      it('should reject negative numbers', () => {
        expect(isNonNegativeInteger(-1)).toBe(false);
        expect(isNonNegativeInteger(-42)).toBe(false);
      });

      it('should reject decimals', () => {
        expect(isNonNegativeInteger(3.14)).toBe(false);
      });
    });
  });

  describe('Range Validation', () => {
    describe('isInRange', () => {
      it('should accept values in range', () => {
        expect(isInRange(5, 1, 10)).toBe(true);
        expect(isInRange(1, 1, 10)).toBe(true);
        expect(isInRange(10, 1, 10)).toBe(true);
      });

      it('should reject values outside range', () => {
        expect(isInRange(0, 1, 10)).toBe(false);
        expect(isInRange(11, 1, 10)).toBe(false);
      });

      it('should reject special values', () => {
        expect(isInRange(NaN, 1, 10)).toBe(false);
        expect(isInRange(Infinity, 1, 10)).toBe(false);
      });
    });

    describe('assertInRange', () => {
      it('should not throw for values in range', () => {
        expect(() => assertInRange(5, 1, 10)).not.toThrow();
      });

      it('should throw for values outside range', () => {
        expect(() => assertInRange(0, 1, 10)).toThrow(ValidationError);
        expect(() => assertInRange(11, 1, 10)).toThrow(ValidationError);
      });

      it('should include custom name in error', () => {
        try {
          assertInRange(11, 1, 10, 'score');
          expect.fail('Should have thrown');
        } catch (error) {
          expect((error as ValidationError).message).toContain('score');
        }
      });
    });
  });

  describe('Array Validation', () => {
    describe('isNonEmptyArray', () => {
      it('should accept non-empty arrays', () => {
        expect(isNonEmptyArray([1])).toBe(true);
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      });

      it('should reject empty arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('should reject non-arrays', () => {
        // @ts-expect-error Testing runtime type guard
        expect(isNonEmptyArray('hello')).toBe(false);
        // @ts-expect-error Testing runtime type guard
        expect(isNonEmptyArray(null)).toBe(false);
      });
    });

    describe('assertNonEmptyArray', () => {
      it('should not throw for non-empty arrays', () => {
        expect(() => assertNonEmptyArray([1, 2, 3])).not.toThrow();
      });

      it('should throw for empty arrays', () => {
        expect(() => assertNonEmptyArray([])).toThrow(ValidationError);
      });

      it('should include custom name in error', () => {
        try {
          assertNonEmptyArray([], 'seasons');
          expect.fail('Should have thrown');
        } catch (error) {
          expect((error as ValidationError).message).toContain('seasons');
        }
      });
    });
  });

  describe('Value Set Validation', () => {
    describe('isOneOf', () => {
      it('should accept values in set', () => {
        expect(isOneOf('REG', ['REG', 'POST', 'PRE'])).toBe(true);
        expect(isOneOf(42, [1, 2, 42, 100])).toBe(true);
      });

      it('should reject values not in set', () => {
        expect(isOneOf('INVALID', ['REG', 'POST', 'PRE'])).toBe(false);
        expect(isOneOf(99, [1, 2, 42, 100])).toBe(false);
      });
    });

    describe('assertOneOf', () => {
      it('should not throw for values in set', () => {
        expect(() => assertOneOf('REG', ['REG', 'POST', 'PRE'])).not.toThrow();
      });

      it('should throw for values not in set', () => {
        expect(() => assertOneOf('INVALID', ['REG', 'POST', 'PRE'])).toThrow(ValidationError);
      });
    });
  });

  describe('Optional Validation', () => {
    describe('isValidOptional', () => {
      const isEven = (n: number): boolean => n % 2 === 0;

      it('should accept null and undefined', () => {
        expect(isValidOptional(null, isEven)).toBe(true);
        expect(isValidOptional(undefined, isEven)).toBe(true);
      });

      it('should validate present values', () => {
        expect(isValidOptional(2, isEven)).toBe(true);
        expect(isValidOptional(3, isEven)).toBe(false);
      });
    });

    describe('optional()', () => {
      const isEven = (n: number): boolean => n % 2 === 0;
      const isEvenOptional = optional(isEven);

      it('should create optional validator', () => {
        expect(isEvenOptional(null)).toBe(true);
        expect(isEvenOptional(undefined)).toBe(true);
        expect(isEvenOptional(2)).toBe(true);
        expect(isEvenOptional(3)).toBe(false);
      });
    });
  });

  describe('Format Validation', () => {
    describe('isValidFormat', () => {
      it('should accept valid formats', () => {
        expect(isValidFormat('csv')).toBe(true);
        expect(isValidFormat('parquet')).toBe(true);
        expect(isValidFormat('json')).toBe(true);
        expect(isValidFormat('rds')).toBe(true);
      });

      it('should reject invalid formats', () => {
        expect(isValidFormat('xml')).toBe(false);
        expect(isValidFormat('txt')).toBe(false);
        expect(isValidFormat('')).toBe(false);
      });
    });

    describe('assertValidFormat', () => {
      it('should not throw for valid formats', () => {
        expect(() => assertValidFormat('csv')).not.toThrow();
        expect(() => assertValidFormat('parquet')).not.toThrow();
      });

      it('should throw for invalid formats', () => {
        expect(() => assertValidFormat('xml')).toThrow(ValidationError);
      });
    });
  });

  describe('Game ID Validation', () => {
    describe('isValidGameId', () => {
      it('should accept valid game IDs', () => {
        expect(isValidGameId('2023_01_KC_PHI')).toBe(true);
        expect(isValidGameId('2020_18_SF_SEA')).toBe(true);
        expect(isValidGameId('2022_22_KC_PHI')).toBe(true); // Super Bowl
      });

      it('should reject invalid formats', () => {
        expect(isValidGameId('invalid')).toBe(false);
        expect(isValidGameId('2023')).toBe(false);
        expect(isValidGameId('2023_01')).toBe(false);
        expect(isValidGameId('2023_01_KC')).toBe(false);
      });

      it('should reject invalid years', () => {
        expect(isValidGameId('1990_01_KC_PHI')).toBe(false);
        expect(isValidGameId('abc_01_KC_PHI')).toBe(false);
      });

      it('should reject invalid weeks', () => {
        expect(isValidGameId('2023_00_KC_PHI')).toBe(false);
        expect(isValidGameId('2023_99_KC_PHI')).toBe(false);
      });

      it('should handle empty strings', () => {
        expect(isValidGameId('')).toBe(false);
      });
    });

    describe('assertValidGameId', () => {
      it('should not throw for valid game IDs', () => {
        expect(() => assertValidGameId('2023_01_KC_PHI')).not.toThrow();
      });

      it('should throw for invalid game IDs', () => {
        expect(() => assertValidGameId('invalid')).toThrow(ValidationError);
      });
    });
  });

  describe('Cross-Validator Interactions', () => {
    it('should handle chained validations', () => {
      // Validate season, week, and team together
      const seasonResult = validateSeason('2023', { coerce: true });
      expect(seasonResult.valid).toBe(true);

      const weekResult = validateWeek('10', { coerce: true, seasonType: 'REG' });
      expect(weekResult.valid).toBe(true);

      const teamResult = validateTeam('kc', { normalize: true });
      expect(teamResult.valid).toBe(true);
    });

    it('should fail fast on first invalid input', () => {
      const seasonResult = validateSeason('1990', { coerce: true });
      if (!seasonResult.valid) {
        // Don't need to validate other fields
        expect(seasonResult.error).toBeDefined();
        return;
      }
    });
  });

  describe('Complex Edge Cases', () => {
    it('should handle unicode and special characters', () => {
      expect(validateSeason('2️⃣0️⃣2️⃣3️⃣', { coerce: true }).valid).toBe(false);
      expect(validateTeam('K♥C', { normalize: true }).valid).toBe(false);
    });

    it('should handle extremely long inputs', () => {
      const longString = 'A'.repeat(1000000);
      const result = validateTeam(longString);
      expect(result.valid).toBe(false);
    });

    it('should handle circular references gracefully', () => {
      const obj: { self?: object } = {};
      obj.self = obj;

      const result = validateSeason(obj);
      expect(result.valid).toBe(false);
    });

    it('should handle mixed types in arrays', () => {
      const mixed = [2023, '2022', null, undefined, {}, []];
      // This should fail on null
      expect(validateSeason(mixed[2]).valid).toBe(false);
    });

    it('should handle symbols', () => {
      const sym = Symbol('test');
      expect(validateSeason(sym).valid).toBe(false);
      expect(validateTeam(sym).valid).toBe(false);
    });

    it('should handle BigInt values', () => {
      const bigIntValue = BigInt(2023);
      // BigInt should not coerce to number
      expect(validateSeason(bigIntValue, { coerce: true }).valid).toBe(false);
    });

    it('should handle Proxy objects', () => {
      const proxy = new Proxy({}, {});
      expect(validateSeason(proxy).valid).toBe(false);
    });

    it('should handle Date objects', () => {
      const date = new Date(2023, 0, 1);
      expect(validateSeason(date).valid).toBe(false);
    });

    it('should handle RegExp', () => {
      const regex = /2023/;
      expect(validateSeason(regex).valid).toBe(false);
    });
  });

  describe('Error Consistency', () => {
    it('should always include error code', () => {
      const results = [validateSeason(1990), validateWeek(0), validateTeam('INVALID')];

      for (const result of results) {
        if (!result.valid) {
          expect(result.error?.code).toBeDefined();
          expect(typeof result.error?.code).toBe('string');
        }
      }
    });

    it('should always include context in validation errors', () => {
      const results = [validateSeason(1990), validateWeek(0), validateTeam('INVALID')];

      for (const result of results) {
        if (!result.valid && result.error instanceof ValidationError) {
          expect(result.error.context).toBeDefined();
          expect(typeof result.error.context).toBe('object');
        }
      }
    });

    it('should have consistent message formats', () => {
      const results = [validateSeason(1990), validateWeek(0), validateTeam('INVALID')];

      for (const result of results) {
        if (!result.valid) {
          expect(result.error?.message).toBeDefined();
          expect(result.error?.message.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Performance Under Edge Conditions', () => {
    it('should handle validation of same value repeatedly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        validateSeason(2023);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should handle alternating valid/invalid values', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        validateSeason(i % 2 === 0 ? 2023 : 1990);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
