/**
 * Tests for schedule data loading
 * @module data/schedules.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadSchedules } from '../../src/data/schedules.js';
import { ValidationError } from '../../src/types/error.js';

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

// Mock parseParquet for parquet tests
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

describe('loadSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2024_01_KC_BAL,2024,REG,1,2024-09-05,KC,BAL',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.game_id).toBe('2024_01_KC_BAL');
      expect(result.value[0]?.season).toBe(2024);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('sched_2024.csv'),
        expect.any(Object)
      );
    });

    it('should load specific season', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.game_id).toBe('2023_01_DET_KC');
      expect(result.value[0]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('sched_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons', async () => {
      const mockResponse2022 = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2022_01_BUF_LAR,2022,REG,1,2022-09-08,BUF,LAR',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2023 = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2022).mockResolvedValueOnce(mockResponse2023);

      const result = await loadSchedules([2022, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2022);
      expect(result.value[1]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true is passed', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2020_01_HOU_KC,2020,REG,1,2020-09-10,HOU,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules(true);

      expect(result.ok).toBe(true);
      // Should load from 1999 to 2024 (26 seasons)
      expect(mockGet).toHaveBeenCalled();
      const callCount = mockGet.mock.calls.length;
      expect(callCount).toBe(2024 - 1999 + 1); // 26 seasons
    });
  });

  describe('validation', () => {
    it('should return error for season before minimum', async () => {
      const result = await loadSchedules(1998);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 1998');
      expect(result.error.message).toContain('Must be between 1999 and 2024');
    });

    it('should return error for future season', async () => {
      const result = await loadSchedules(2025);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 2025');
      expect(result.error.message).toContain('Must be between 1999 and 2024');
    });

    it('should return error for invalid season in array', async () => {
      const result = await loadSchedules([2023, 2025]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  describe('format options', () => {
    it('should load CSV format by default', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should load Parquet format when specified', async () => {
      const mockParquetData = new ArrayBuffer(100);
      const mockResponse = {
        data: mockParquetData,
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      // Mock parseParquet to return test data
      mockParseParquet.mockResolvedValue([
        {
          game_id: '2023_01_DET_KC',
          season: 2023,
          game_type: 'REG',
          week: 1,
          gameday: '2023-09-07',
          away_team: 'DET',
          home_team: 'KC',
        },
      ]);

      const result = await loadSchedules(2023, { format: 'parquet' });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return array of schedule records with proper structure', async () => {
      const mockResponse = {
        data: `game_id,season,game_type,week,gameday,weekday,gametime,away_team,away_score,home_team,home_score,location,result,total,overtime
2023_01_DET_KC,2023,REG,1,2023-09-07,Thursday,20:20,DET,20,KC,21,Home,1,41,0`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const game = result.value[0]!;
      expect(game.game_id).toBe('2023_01_DET_KC');
      expect(game.season).toBe(2023);
      expect(game.game_type).toBe('REG');
      expect(game.week).toBe(1);
      expect(game.gameday).toBe('2023-09-07');
      expect(game.weekday).toBe('Thursday');
      expect(game.gametime).toBe('20:20');
      expect(game.away_team).toBe('DET');
      expect(game.away_score).toBe(20);
      expect(game.home_team).toBe('KC');
      expect(game.home_score).toBe(21);
      expect(game.location).toBe('Home');
      expect(game.result).toBe(1);
      expect(game.total).toBe(41);
      expect(game.overtime).toBe(0);
    });

    it('should handle null values for future games', async () => {
      const mockResponse = {
        data: `game_id,season,game_type,week,gameday,away_team,home_team,away_score,home_score,result,total
2024_18_BUF_KC,2024,REG,18,2024-12-29,BUF,KC,,,,`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules(2024);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const game = result.value[0]!;
      expect(game.game_id).toBe('2024_18_BUF_KC');
      expect(game.away_score).toBeNull();
      expect(game.home_score).toBeNull();
      expect(game.result).toBeNull();
      expect(game.total).toBeNull();
    });
  });

  describe('parallel fetching', () => {
    it('should fetch multiple seasons in parallel', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2020_01_HOU_KC,2020,REG,1,2020-09-10,HOU,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const result = await loadSchedules([2020, 2021, 2022]);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      // Should be called 3 times (once per season)
      expect(mockGet).toHaveBeenCalledTimes(3);

      // Parallel execution should be faster than sequential
      // (though this is a mock, we're verifying Promise.all is used)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('data concatenation', () => {
    it('should concatenate multiple season datasets efficiently', async () => {
      const mockResponse2021 = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2021_01_TB_DAL,2021,REG,1,2021-09-09,TB,DAL\n2021_01_PIT_BUF,2021,REG,1,2021-09-12,PIT,BUF',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2022 = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2022_01_BUF_LAR,2022,REG,1,2022-09-08,BUF,LAR\n2022_01_NO_ATL,2022,REG,1,2022-09-11,NO,ATL\n2022_01_CLE_CAR,2022,REG,1,2022-09-11,CLE,CAR',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2021).mockResolvedValueOnce(mockResponse2022);

      const result = await loadSchedules([2021, 2022]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // Should have 2 games from 2021 + 3 games from 2022 = 5 total
      expect(result.value).toHaveLength(5);
      expect(result.value[0]?.season).toBe(2021);
      expect(result.value[2]?.season).toBe(2022);
    });
  });

  describe('options', () => {
    it('should pass signal to HttpClient for request cancellation', async () => {
      const mockResponse = {
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const controller = new AbortController();
      const result = await loadSchedules(2023, { signal: controller.signal });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadSchedules(2023);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('Network error');
    });

    it('should handle CSV parsing gracefully', async () => {
      const mockResponse = {
        data: 'invalid csv data that cannot be parsed',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      // parseCsv should handle this gracefully and return an error or empty data
      const result = await loadSchedules(2023);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBeDefined();
    });
  });
});
