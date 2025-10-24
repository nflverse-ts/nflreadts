/**
 * Tests for team constants
 * Note: Type interfaces are validated by TypeScript compilation, not runtime tests
 */

import { describe, expect, it } from 'vitest';

import { HISTORICAL_TEAMS, NFL_TEAMS } from '../../src/types/team.js';

describe('Team Constants', () => {
  describe('NFL_TEAMS', () => {
    it('should contain exactly 32 teams', () => {
      expect(NFL_TEAMS).toHaveLength(32);
    });

    it('should contain all current NFL teams', () => {
      const expectedTeams = [
        // AFC East
        'BUF',
        'MIA',
        'NE',
        'NYJ',
        // AFC North
        'BAL',
        'CIN',
        'CLE',
        'PIT',
        // AFC South
        'HOU',
        'IND',
        'JAX',
        'TEN',
        // AFC West
        'DEN',
        'KC',
        'LV',
        'LAC',
        // NFC East
        'DAL',
        'NYG',
        'PHI',
        'WAS',
        // NFC North
        'CHI',
        'DET',
        'GB',
        'MIN',
        // NFC South
        'ATL',
        'CAR',
        'NO',
        'TB',
        // NFC West
        'ARI',
        'LA',
        'SF',
        'SEA',
      ];

      for (const team of expectedTeams) {
        expect(NFL_TEAMS).toContain(team);
      }
    });
  });

  describe('HISTORICAL_TEAMS', () => {
    it('should contain relocated/renamed team abbreviations', () => {
      expect(HISTORICAL_TEAMS).toContain('SD'); // San Diego → LAC
      expect(HISTORICAL_TEAMS).toContain('STL'); // St. Louis → LA
      expect(HISTORICAL_TEAMS).toContain('OAK'); // Oakland → LV
    });

    it('should have exactly 3 historical teams', () => {
      expect(HISTORICAL_TEAMS).toHaveLength(3);
    });
  });
});
