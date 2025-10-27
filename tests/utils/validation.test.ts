/**
 * Tests for validation utilities
 */

import { describe, expect, it } from 'vitest';

import { ErrorCode, ValidationError } from '../../src/types/error.js';
import { getCurrentSeason } from '../../src/utils/datetime.js';
import {
  MAX_PLAYOFF_WEEK,
  MAX_REGULAR_SEASON_WEEK,
  MIN_SEASON,
  SEASON_TYPES,
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
  validateSeasons,
  validateTeams,
} from '../../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('Constants', () => {
    it('should have correct minimum season', () => {
      expect(MIN_SEASON).toBe(1999);
    });

    it('should have correct max regular season week', () => {
      expect(MAX_REGULAR_SEASON_WEEK).toBe(18);
    });

    it('should have correct max playoff week', () => {
      expect(MAX_PLAYOFF_WEEK).toBe(22);
    });

    it('should have all season types', () => {
      expect(SEASON_TYPES).toContain('REG');
      expect(SEASON_TYPES).toContain('POST');
      expect(SEASON_TYPES).toContain('PRE');
    });
  });

  describe('getCurrentSeason', () => {
    it('should return a valid season', () => {
      const season = getCurrentSeason();
      expect(season).toBeGreaterThanOrEqual(MIN_SEASON);
      expect(season).toBeLessThanOrEqual(new Date().getFullYear());
    });
  });

  describe('isValidSeason', () => {
    it('should accept valid seasons', () => {
      expect(isValidSeason(2020)).toBe(true);
      expect(isValidSeason(2023)).toBe(true);
      expect(isValidSeason(getCurrentSeason())).toBe(true);
    });

    it('should reject seasons before MIN_SEASON', () => {
      expect(isValidSeason(1998)).toBe(false);
      expect(isValidSeason(1900)).toBe(false);
    });

    it('should reject seasons too far in the future', () => {
      expect(isValidSeason(getCurrentSeason() + 5)).toBe(false);
    });

    it('should reject non-integer seasons', () => {
      expect(isValidSeason(2023.5)).toBe(false);
    });
  });

  describe('assertValidSeason', () => {
    it('should not throw for valid seasons', () => {
      expect(() => assertValidSeason(2023)).not.toThrow();
    });

    it('should throw ValidationError for invalid seasons', () => {
      expect(() => assertValidSeason(1998)).toThrow(ValidationError);
      expect(() => assertValidSeason(1998)).toThrow(/Invalid season/);
    });

    it('should include error code', () => {
      try {
        assertValidSeason(1998);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.code).toBe(ErrorCode.INVALID_SEASON);
        }
      }
    });
  });

  describe('isValidWeek', () => {
    it('should accept valid regular season weeks', () => {
      expect(isValidWeek(1, 'REG')).toBe(true);
      expect(isValidWeek(9, 'REG')).toBe(true);
      expect(isValidWeek(18, 'REG')).toBe(true);
    });

    it('should reject invalid regular season weeks', () => {
      expect(isValidWeek(0, 'REG')).toBe(false);
      expect(isValidWeek(19, 'REG')).toBe(false);
      expect(isValidWeek(-1, 'REG')).toBe(false);
    });

    it('should accept valid postseason weeks', () => {
      expect(isValidWeek(19, 'POST')).toBe(true);
      expect(isValidWeek(22, 'POST')).toBe(true);
    });

    it('should reject invalid postseason weeks', () => {
      expect(isValidWeek(18, 'POST')).toBe(false);
      expect(isValidWeek(23, 'POST')).toBe(false);
    });

    it('should accept valid preseason weeks', () => {
      expect(isValidWeek(1, 'PRE')).toBe(true);
      expect(isValidWeek(4, 'PRE')).toBe(true);
    });

    it('should reject invalid preseason weeks', () => {
      expect(isValidWeek(5, 'PRE')).toBe(false);
    });

    it('should default to regular season', () => {
      expect(isValidWeek(10)).toBe(true);
      expect(isValidWeek(19)).toBe(false);
    });
  });

  describe('assertValidWeek', () => {
    it('should not throw for valid weeks', () => {
      expect(() => assertValidWeek(1, 'REG')).not.toThrow();
    });

    it('should throw ValidationError for invalid weeks', () => {
      expect(() => assertValidWeek(19, 'REG')).toThrow(ValidationError);
      expect(() => assertValidWeek(0, 'REG')).toThrow(/Invalid week/);
    });
  });

  describe('isValidTeam', () => {
    it('should accept valid current teams', () => {
      expect(isValidTeam('KC')).toBe(true);
      expect(isValidTeam('PHI')).toBe(true);
      expect(isValidTeam('SF')).toBe(true);
    });

    it('should reject invalid teams', () => {
      expect(isValidTeam('INVALID')).toBe(false);
      expect(isValidTeam('XX')).toBe(false);
    });

    it('should reject historical teams', () => {
      expect(isValidTeam('SD')).toBe(false);
      expect(isValidTeam('OAK')).toBe(false);
    });
  });

  describe('isValidTeamOrHistorical', () => {
    it('should accept current teams', () => {
      expect(isValidTeamOrHistorical('KC')).toBe(true);
    });

    it('should accept historical teams', () => {
      expect(isValidTeamOrHistorical('SD')).toBe(true);
      expect(isValidTeamOrHistorical('OAK')).toBe(true);
      expect(isValidTeamOrHistorical('STL')).toBe(true);
    });

    it('should reject invalid teams', () => {
      expect(isValidTeamOrHistorical('INVALID')).toBe(false);
    });
  });

  describe('assertValidTeam', () => {
    it('should not throw for valid teams', () => {
      expect(() => assertValidTeam('KC')).not.toThrow();
    });

    it('should accept historical teams by default', () => {
      expect(() => assertValidTeam('SD')).not.toThrow();
    });

    it('should reject historical teams if allowHistorical is false', () => {
      expect(() => assertValidTeam('SD', false)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid teams', () => {
      expect(() => assertValidTeam('INVALID')).toThrow(ValidationError);
      expect(() => assertValidTeam('INVALID')).toThrow(/Invalid team/);
    });
  });

  describe('isValidSeasonType', () => {
    it('should accept valid season types', () => {
      expect(isValidSeasonType('REG')).toBe(true);
      expect(isValidSeasonType('POST')).toBe(true);
      expect(isValidSeasonType('PRE')).toBe(true);
    });

    it('should reject invalid season types', () => {
      expect(isValidSeasonType('INVALID')).toBe(false);
      expect(isValidSeasonType('reg')).toBe(false); // Case sensitive
    });
  });

  describe('assertValidSeasonType', () => {
    it('should not throw for valid season types', () => {
      expect(() => assertValidSeasonType('REG')).not.toThrow();
    });

    it('should throw ValidationError for invalid season types', () => {
      expect(() => assertValidSeasonType('INVALID')).toThrow(ValidationError);
    });
  });

  describe('normalizeTeamAbbr', () => {
    it('should convert to uppercase', () => {
      expect(normalizeTeamAbbr('kc')).toBe('KC');
      expect(normalizeTeamAbbr('phi')).toBe('PHI');
    });

    it('should trim whitespace', () => {
      expect(normalizeTeamAbbr('  KC  ')).toBe('KC');
    });

    it('should handle common variations', () => {
      expect(normalizeTeamAbbr('LAR')).toBe('LA');
      expect(normalizeTeamAbbr('WSH')).toBe('WAS');
      expect(normalizeTeamAbbr('WFT')).toBe('WAS');
    });

    it('should leave valid abbreviations unchanged', () => {
      expect(normalizeTeamAbbr('KC')).toBe('KC');
      expect(normalizeTeamAbbr('PHI')).toBe('PHI');
    });
  });

  describe('validateSeasons', () => {
    it('should validate array of valid seasons', () => {
      const seasons = validateSeasons([2020, 2021, 2022]);
      expect(seasons).toEqual([2020, 2021, 2022]);
    });

    it('should throw on invalid season', () => {
      expect(() => validateSeasons([2020, 1998, 2022])).toThrow(ValidationError);
    });
  });

  describe('validateTeams', () => {
    it('should validate array of valid teams', () => {
      const teams = validateTeams(['KC', 'PHI', 'SF']);
      expect(teams).toEqual(['KC', 'PHI', 'SF']);
    });

    it('should throw on invalid team', () => {
      expect(() => validateTeams(['KC', 'INVALID', 'PHI'])).toThrow(ValidationError);
    });

    it('should accept historical teams by default', () => {
      const teams = validateTeams(['KC', 'SD']);
      expect(teams).toEqual(['KC', 'SD']);
    });

    it('should reject historical teams if allowHistorical is false', () => {
      expect(() => validateTeams(['KC', 'SD'], false)).toThrow(ValidationError);
    });
  });
});
