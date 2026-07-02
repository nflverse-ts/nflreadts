/**
 * Tests for player stats data loading
 * @module data/playerstats.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';
import { loadPlayerStats } from '../../src/data/player-stats.js';

// Mock the HttpClient
const mockGet = vi.fn();
vi.mock('../../src/client/client.js', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

// Fixtures are CSV strings; route the parquet default path through the real
// CSV parser so both format branches share the same fixtures.
vi.mock('../../src/utils/parse.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/parse.js')>();
  return {
    ...actual,
    parseParquet: vi.fn((buffer: ArrayBuffer | string) => {
      const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
      return Promise.resolve(actual.parseCsv(text).data);
    }),
  };
});

// Mock the config manager
vi.mock('../../src/config/manager.js', () => ({
  getConfig: vi.fn(() => ({
    http: {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      userAgent: 'test',
      headers: {},
    },
    cache: {
      enabled: true,
      ttl: 3600000,
      maxSize: 100,
      storage: 'memory' as const,
    },
    dataSources: {
      baseUrl: 'https://github.com/nflverse/nflverse-data/releases/download',
      mirrors: [],
    },
    logging: {
      debug: false,
      level: 'warn' as const,
    },
  })),
}));

// Mock the datetime utils
vi.mock('../../src/utils/datetime.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/datetime.js')>(
    '../../src/utils/datetime.js'
  );
  return {
    ...actual,
    getCurrentSeason: vi.fn(() => 2023),
  };
});

describe('loadPlayerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week\n00-0012345,J.Smith,2023,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats_player_week_2023'));
    });

    it('should load single season when number provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2022',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats_player_week_2022'));
    });

    it('should load multiple seasons when array provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2021',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2020',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 1999 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(25); // 1999-2023
    });
  });

  describe('format support', () => {
    it('should load parquet format by default', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'));
    });

    it('should load CSV format when specified', async () => {
      const mockCsvData = 'a,b\n1,2';

      const mockResponse: HttpResponse = {
        data: mockCsvData,
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadPlayerStats(2023, { format: 'csv' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'));
    });
  });

  describe('summary level support', () => {
    it('should default to week level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season,week\n00-0012345,2023,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023);

      expect(result.ok).toBe(true);
    });

    it('should accept reg summary level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
    });

    it('should accept post summary level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'post' });

      expect(result.ok).toBe(true);
    });

    it('should accept reg+post summary level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg+post' });

      expect(result.ok).toBe(true);
    });
  });

  describe('summary level file selection', () => {
    // Files are pre-aggregated by nflverse; the summary level selects which
    // stats_player file is fetched and data passes through unchanged
    const passthroughResponse: HttpResponse = {
      data: 'player_id,season,week,passing_yards\n00-0012345,2023,1,300\n00-0012345,2023,2,250',
      status: 200,
      headers: {},
      fromCache: false,
      url: 'test-url',
    };

    it('should return file contents unchanged', async () => {
      mockGet.mockResolvedValue(passthroughResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'week' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0]?.week).toBe(1);
        expect(result.value[1]?.week).toBe(2);
      }
    });

    it('should fetch the reg file for reg level', async () => {
      mockGet.mockResolvedValue(passthroughResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats_player_reg_2023'));
    });

    it('should fetch the post file for post level', async () => {
      mockGet.mockResolvedValue(passthroughResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'post' });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats_player_post_2023'));
    });

    it('should fetch the regpost file for reg+post level', async () => {
      mockGet.mockResolvedValue(passthroughResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg+post' });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stats_player_regpost_2023'));
    });
  });

  describe('error handling', () => {
    it('should return error for invalid season', async () => {
      const result = await loadPlayerStats(1998);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error when data not found', async () => {
      const mockResponse: HttpResponse = {
        data: null,
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadPlayerStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should fail fast when any season fails in multi-season request', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'player_id,season\n00-0012345,2021',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        })
        .mockResolvedValueOnce({
          data: null,
          status: 404,
          headers: {},
          fromCache: false,
          url: 'test-url',
        });

      const result = await loadPlayerStats([2021, 2022]);

      expect(result.ok).toBe(false);
    });
  });

  describe('data combination', () => {
    it('should combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'player_id,season\n00-0012345,2021\n00-0023456,2021',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        })
        .mockResolvedValueOnce({
          data: 'player_id,season\n00-0034567,2022\n00-0045678,2022',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        });

      const result = await loadPlayerStats([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
      }
    });
  });

  describe('validation', () => {
    it('should validate all seasons before loading', async () => {
      const result = await loadPlayerStats([2020, 1995, 2021]);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should accept future season (current + 1)', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season\n00-0012345,2024',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2024);

      expect(result.ok).toBe(true);
    });

    it('should reject season too far in future', async () => {
      const result = await loadPlayerStats(2030);

      expect(result.ok).toBe(false);
    });
  });

  describe('URL building', () => {
    it('should build correct URL for player stats', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id\n00-0012345',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadPlayerStats(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/stats_player\/stats_player_week_2023\.parquet$/)
      );
    });
  });
});
