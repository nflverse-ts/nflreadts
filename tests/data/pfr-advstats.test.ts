/**
 * Tests for PFR advanced stats data loading
 * @module data/pfr-advstats.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPfrAdvstats } from '../../src/data/pfr-advstats.js';

// Use vi.hoisted to declare mocks that will be used in vi.mock
const { mockGet, mockParseParquet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockParseParquet: vi.fn(),
}));

// Mock the HttpClient
vi.mock('../../src/client/client.js', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

// Mock the datetime utils
vi.mock('../../src/utils/datetime.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/datetime.js')>(
    '../../src/utils/datetime.js'
  );
  return {
    ...actual,
    getCurrentSeason: vi.fn(() => 2024),
  };
});

// Mock parseParquet for parquet format tests
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

const weekCsv = [
  'game_id,season,week,team,pfr_player_id,passing_drops',
  '2023_01_DET_KC,2023,1,KC,MahoPa00,1',
  '2023_02_KC_JAX,2023,2,KC,MahoPa00,0',
].join('\n');

const seasonCsv = [
  'player,pfr_id,season,tm',
  'Patrick Mahomes,MahoPa00,2023,KC',
  'Josh Allen,AlleJo02,2024,BUF',
].join('\n');

const csvResponse = (data: string) => ({
  data,
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
});

describe('loadPfrAdvstats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(csvResponse(weekCsv));
  });

  describe('URL construction and routing', () => {
    it('should default to weekly passing stats for the current season', async () => {
      const result = await loadPfrAdvstats();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/pfr_advstats\/advstats_week_pass_2024\.csv$/),
        expect.any(Object)
      );
    });

    it('should route statType into the week-level file name', async () => {
      await loadPfrAdvstats(2023, { statType: 'rush' });
      await loadPfrAdvstats(2023, { statType: 'rec' });
      await loadPfrAdvstats(2023, { statType: 'def' });

      expect(mockGet).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/advstats_week_rush_2023\.csv$/),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/advstats_week_rec_2023\.csv$/),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/advstats_week_def_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should fetch the single season-level file for summaryLevel season', async () => {
      mockGet.mockResolvedValue(csvResponse(seasonCsv));

      const result = await loadPfrAdvstats([2023, 2024], {
        statType: 'def',
        summaryLevel: 'season',
      });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/pfr_advstats\/advstats_season_def\.csv$/),
        expect.any(Object)
      );
    });

    it('should use parquet URLs when format is parquet', async () => {
      mockParseParquet.mockResolvedValue([{ season: 2023 }]);
      mockGet.mockResolvedValue(csvResponse(''));

      await loadPfrAdvstats(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/advstats_week_pass_2023\.parquet$/),
        expect.any(Object)
      );
      expect(mockParseParquet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season handling', () => {
    it('should fetch one file per season at week level', async () => {
      const result = await loadPfrAdvstats([2022, 2023]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/advstats_week_pass_2022\.csv$/),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/advstats_week_pass_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should combine records across seasons at week level', async () => {
      const result = await loadPfrAdvstats([2022, 2023]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(4);
      }
    });

    it('should filter the season-level file to requested seasons', async () => {
      mockGet.mockResolvedValue(csvResponse(seasonCsv));

      const result = await loadPfrAdvstats(2024, { summaryLevel: 'season' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.player).toBe('Josh Allen');
      }
    });

    it('should return the season-level file unfiltered when seasons is true', async () => {
      mockGet.mockResolvedValue(csvResponse(seasonCsv));

      const result = await loadPfrAdvstats(true, { summaryLevel: 'season' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2018 without fetching', async () => {
      const result = await loadPfrAdvstats(2017);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('2018');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for a future season', async () => {
      const result = await loadPfrAdvstats(2025);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should reject an invalid stat type without fetching', async () => {
      const result = await loadPfrAdvstats(2023, {
        statType: 'kick' as unknown as 'pass',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('statType');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should reject an invalid summary level without fetching', async () => {
      const result = await loadPfrAdvstats(2023, {
        summaryLevel: 'monthly' as unknown as 'week',
      });

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error when data not found', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadPfrAdvstats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadPfrAdvstats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
