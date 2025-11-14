/**
 * Tests for team validation
 */

import { describe, expect, it } from 'vitest';
import {
  assertValidTeam,
  isValidTeam,
  isValidTeamOrHistorical,
  normalizeTeamAbbr,
  validateTeam,
  validateTeams,
} from '../../src/validation/index.js';
import { ErrorCode, ValidationError } from '../../src/types/error.js';

describe('Team Validation', () => {
  describe('isValidTeam', () => {
    it('should accept current NFL teams', () => {
      expect(isValidTeam('KC')).toBe(true);
      expect(isValidTeam('SF')).toBe(true);
      expect(isValidTeam('BUF')).toBe(true);
      expect(isValidTeam('PHI')).toBe(true);
    });

    it('should accept all current teams', () => {
      const currentTeams = [
        'ARI',
        'ATL',
        'BAL',
        'BUF',
        'CAR',
        'CHI',
        'CIN',
        'CLE',
        'DAL',
        'DEN',
        'DET',
        'GB',
        'HOU',
        'IND',
        'JAX',
        'KC',
        'LA',
        'LAC',
        'LV',
        'MIA',
        'MIN',
        'NE',
        'NO',
        'NYG',
        'NYJ',
        'PHI',
        'PIT',
        'SEA',
        'SF',
        'TB',
        'TEN',
        'WAS',
      ];

      for (const team of currentTeams) {
        expect(isValidTeam(team)).toBe(true);
      }
    });

    it('should reject historical teams', () => {
      expect(isValidTeam('SD')).toBe(false); // San Diego Chargers
      expect(isValidTeam('STL')).toBe(false); // St. Louis Rams
      expect(isValidTeam('OAK')).toBe(false); // Oakland Raiders
    });

    it('should reject invalid abbreviations', () => {
      expect(isValidTeam('INVALID')).toBe(false);
      expect(isValidTeam('XX')).toBe(false);
      expect(isValidTeam('NFL')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidTeam('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidTeam('kc')).toBe(false);
      expect(isValidTeam('Kc')).toBe(false);
      expect(isValidTeam('KC')).toBe(true);
    });
  });

  describe('isValidTeamOrHistorical', () => {
    it('should accept current teams', () => {
      expect(isValidTeamOrHistorical('KC')).toBe(true);
      expect(isValidTeamOrHistorical('SF')).toBe(true);
    });

    it('should accept historical teams', () => {
      expect(isValidTeamOrHistorical('SD')).toBe(true);
      expect(isValidTeamOrHistorical('STL')).toBe(true);
      expect(isValidTeamOrHistorical('OAK')).toBe(true);
    });

    it('should reject invalid abbreviations', () => {
      expect(isValidTeamOrHistorical('INVALID')).toBe(false);
      expect(isValidTeamOrHistorical('')).toBe(false);
    });
  });

  describe('assertValidTeam', () => {
    it('should not throw for valid teams', () => {
      expect(() => assertValidTeam('KC')).not.toThrow();
      expect(() => assertValidTeam('SF')).not.toThrow();
    });

    it('should allow historical teams by default', () => {
      expect(() => assertValidTeam('SD')).not.toThrow();
      expect(() => assertValidTeam('STL')).not.toThrow();
    });

    it('should reject historical teams when allowHistorical=false', () => {
      expect(() => assertValidTeam('SD', false)).toThrow(ValidationError);
      expect(() => assertValidTeam('STL', false)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid teams', () => {
      expect(() => assertValidTeam('INVALID')).toThrow(ValidationError);
    });

    it('should throw with correct error code', () => {
      try {
        assertValidTeam('INVALID');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_TEAM);
      }
    });

    it('should include context in error', () => {
      try {
        assertValidTeam('INVALID');
        expect.fail('Should have thrown');
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('team', 'INVALID');
        expect(validationError.context).toHaveProperty('allowHistorical');
      }
    });
  });

  describe('normalizeTeamAbbr', () => {
    it('should normalize to uppercase', () => {
      expect(normalizeTeamAbbr('kc')).toBe('KC');
      expect(normalizeTeamAbbr('sf')).toBe('SF');
      expect(normalizeTeamAbbr('buf')).toBe('BUF');
    });

    it('should handle mixed case', () => {
      expect(normalizeTeamAbbr('Kc')).toBe('KC');
      expect(normalizeTeamAbbr('sF')).toBe('SF');
    });

    it('should trim whitespace', () => {
      expect(normalizeTeamAbbr('  KC  ')).toBe('KC');
      expect(normalizeTeamAbbr('\tSF\n')).toBe('SF');
    });

    it('should handle known variations', () => {
      expect(normalizeTeamAbbr('LAR')).toBe('LA');
      expect(normalizeTeamAbbr('WSH')).toBe('WAS');
      expect(normalizeTeamAbbr('WFT')).toBe('WAS'); // Washington Football Team
    });

    it('should handle lowercase variations', () => {
      expect(normalizeTeamAbbr('lar')).toBe('LA');
      expect(normalizeTeamAbbr('wsh')).toBe('WAS');
      expect(normalizeTeamAbbr('wft')).toBe('WAS');
    });

    it('should not modify already normalized teams', () => {
      expect(normalizeTeamAbbr('KC')).toBe('KC');
      expect(normalizeTeamAbbr('SF')).toBe('SF');
      expect(normalizeTeamAbbr('WAS')).toBe('WAS');
    });
  });

  describe('validateTeam (with options)', () => {
    it('should validate and return valid team', () => {
      const result = validateTeam('KC');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('KC');
      expect(result.error).toBeUndefined();
    });

    it('should normalize lowercase input', () => {
      const result = validateTeam('kc', { normalize: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('KC');
    });

    it('should normalize variations', () => {
      const result = validateTeam('lar', { normalize: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('LA');
    });

    it('should coerce to uppercase when coerce=true', () => {
      const result = validateTeam('kc', { coerce: true, normalize: false });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('KC');
    });

    it('should trim whitespace', () => {
      const result = validateTeam('  KC  ', { coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('KC');
    });

    it('should reject invalid teams', () => {
      const result = validateTeam('INVALID');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.INVALID_TEAM);
    });

    it('should respect allowHistorical option', () => {
      const allowResult = validateTeam('SD', { allowHistorical: true });
      expect(allowResult.valid).toBe(true);

      const rejectResult = validateTeam('SD', { allowHistorical: false });
      expect(rejectResult.valid).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = validateTeam('');
      expect(result.valid).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      const result = validateTeam('   ');
      expect(result.valid).toBe(false);
    });

    it('should handle non-string inputs with coercion', () => {
      const result = validateTeam(123, { coerce: true });
      expect(result.valid).toBe(false); // '123' is not a valid team
    });

    it('should reject non-string without coercion', () => {
      const result = validateTeam(123, { coerce: false });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTeams (array)', () => {
    it('should validate array of teams', () => {
      const result = validateTeams(['KC', 'SF', 'BUF']);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC', 'SF', 'BUF']);
    });

    it('should validate single team as array', () => {
      const result = validateTeams('KC');
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC']);
    });

    it('should remove duplicates by default', () => {
      const result = validateTeams(['KC', 'SF', 'KC', 'BUF', 'SF']);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC', 'SF', 'BUF']);
    });

    it('should keep duplicates when unique=false', () => {
      const result = validateTeams(['KC', 'SF', 'KC'], {}, { unique: false });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC', 'SF', 'KC']);
    });

    it('should fail on first invalid team', () => {
      const result = validateTeams(['KC', 'INVALID', 'BUF']);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.INVALID_TEAM);
    });

    it('should normalize all teams', () => {
      const result = validateTeams(['kc', 'sf', 'buf'], { normalize: true });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC', 'SF', 'BUF']);
    });

    it('should respect minLength option', () => {
      const result = validateTeams(['KC'], {}, { minLength: 2 });
      expect(result.valid).toBe(false);
    });

    it('should respect maxLength option', () => {
      const result = validateTeams(['KC', 'SF', 'BUF'], {}, { maxLength: 2 });
      expect(result.valid).toBe(false);
    });

    it('should validate with team options', () => {
      const result = validateTeams(['KC', 'SD'], { allowHistorical: true });
      expect(result.valid).toBe(true);

      const invalidResult = validateTeams(['KC', 'SD'], { allowHistorical: false });
      expect(invalidResult.valid).toBe(false);
    });

    it('should handle empty array', () => {
      const result = validateTeams([], {}, { minLength: 0 });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should reject empty array when minLength > 0', () => {
      const result = validateTeams([], {}, { minLength: 1 });
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters', () => {
      expect(isValidTeam('K@C')).toBe(false);
      expect(isValidTeam('$F')).toBe(false);
    });

    it('should handle numbers', () => {
      expect(isValidTeam('K1')).toBe(false);
      expect(isValidTeam('123')).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(1000);
      expect(isValidTeam(longString)).toBe(false);
    });

    it('should handle unicode characters', () => {
      expect(isValidTeam('K️C')).toBe(false);
      expect(isValidTeam('S♥F')).toBe(false);
    });

    it('should handle null and undefined', () => {
      const nullResult = validateTeam(null);
      expect(nullResult.valid).toBe(false);

      const undefinedResult = validateTeam(undefined);
      expect(undefinedResult.valid).toBe(false);
    });

    it('should handle objects and arrays', () => {
      const objectResult = validateTeam({});
      expect(objectResult.valid).toBe(false);

      const arrayResult = validateTeam(['KC']);
      expect(arrayResult.valid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with normalized and validated pipeline', () => {
      const input = '  lar  ';
      const result = validateTeam(input, { normalize: true, coerce: true });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('LA');
    });

    it('should handle all 32 current teams', () => {
      const teams = [
        'ARI',
        'ATL',
        'BAL',
        'BUF',
        'CAR',
        'CHI',
        'CIN',
        'CLE',
        'DAL',
        'DEN',
        'DET',
        'GB',
        'HOU',
        'IND',
        'JAX',
        'KC',
        'LA',
        'LAC',
        'LV',
        'MIA',
        'MIN',
        'NE',
        'NO',
        'NYG',
        'NYJ',
        'PHI',
        'PIT',
        'SEA',
        'SF',
        'TB',
        'TEN',
        'WAS',
      ];

      const result = validateTeams(teams);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(teams);
      expect(result.value?.length).toBe(32);
    });
  });

  describe('Performance', () => {
    it('should handle large arrays efficiently', () => {
      const teams = Array.from({ length: 1000 }, () => 'KC');
      const start = Date.now();
      const result = validateTeams(teams, {}, { unique: true });
      const duration = Date.now() - start;

      expect(result.valid).toBe(true);
      expect(result.value).toEqual(['KC']);
      expect(duration).toBeLessThan(100);
    });
  });
});
