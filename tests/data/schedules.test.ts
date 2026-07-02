/**
 * Tests for schedule data loading
 * @module data/schedules.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadSchedules } from '../../src/data/schedules.js';
import { ValidationError } from '../../src/types/error.js';
import { parseCsv } from '../../src/utils/parse.js';

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
    // Fixtures are CSV strings; route the parquet default path through the
    // real CSV parser so both format branches share the same fixtures.
    mockParseParquet.mockImplementation((buffer: ArrayBuffer | string) => {
      const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
      return Promise.resolve(parseCsv(text).data);
    });
  });

  // All seasons live in a single games file; loaders fetch once and filter
  const allSeasonsCsv = [
    'game_id,season,game_type,week,gameday,away_team,home_team',
    '2022_01_BUF_LAR,2022,REG,1,2022-09-08,BUF,LAR',
    '2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
    '2024_01_KC_BAL,2024,REG,1,2024-09-05,KC,BAL',
  ].join('\n');

  const allSeasonsResponse = {
    data: allSeasonsCsv,
    status: 200,
    headers: { 'content-type': 'text/csv' },
    fromCache: false,
    url: 'test-url',
  };

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadSchedules();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.game_id).toBe('2024_01_KC_BAL');
      expect(result.value[0]?.season).toBe(2024);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('games.parquet'),
        expect.any(Object)
      );
    });

    it('should load specific season', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadSchedules(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.game_id).toBe('2023_01_DET_KC');
      expect(result.value[0]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('games.parquet'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons from the single games file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadSchedules([2022, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2022);
      expect(result.value[1]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return the full file when true is passed', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadSchedules(true);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      expect(mockGet).toHaveBeenCalledTimes(1);
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
    it('should load parquet format by default', async () => {
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
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });

    it('should load CSV format when specified', async () => {
      mockGet.mockResolvedValue({
        data: 'game_id,season,game_type,week,gameday,away_team,home_team\n2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadSchedules(2023, { format: 'csv' });

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

  describe('season filtering', () => {
    it('should filter multi-game seasons correctly from the single file', async () => {
      const mockResponse = {
        data: [
          'game_id,season,game_type,week,gameday,away_team,home_team',
          '2021_01_TB_DAL,2021,REG,1,2021-09-09,TB,DAL',
          '2021_01_PIT_BUF,2021,REG,1,2021-09-12,PIT,BUF',
          '2022_01_BUF_LAR,2022,REG,1,2022-09-08,BUF,LAR',
          '2022_01_NO_ATL,2022,REG,1,2022-09-11,NO,ATL',
          '2022_01_CLE_CAR,2022,REG,1,2022-09-11,CLE,CAR',
          '2023_01_DET_KC,2023,REG,1,2023-09-07,DET,KC',
        ].join('\n'),
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadSchedules([2021, 2022]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 2 games from 2021 + 3 games from 2022 = 5 total; 2023 excluded
      expect(result.value).toHaveLength(5);
      expect(result.value[0]?.season).toBe(2021);
      expect(result.value[2]?.season).toBe(2022);
      expect(mockGet).toHaveBeenCalledTimes(1);
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
