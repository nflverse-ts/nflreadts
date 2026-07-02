/**
 * Tests for weekly roster data loading
 * @module data/rosters-weekly.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';

import { loadRostersWeekly } from '../../src/data/rosters-weekly.js';

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

const csvResponse = (data: string): HttpResponse => ({
  data,
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
});

describe('loadRostersWeekly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week,full_name\n2023,KC,1,Test Player'));

      const result = await loadRostersWeekly();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_weekly_2023'),
        expect.any(Object)
      );
    });

    it('should load single season when number provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week\n2022,KC,1'));

      const result = await loadRostersWeekly(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_weekly_2022'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons when array provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week\n2021,KC,1'));

      const result = await loadRostersWeekly([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week\n2020,KC,1'));

      const result = await loadRostersWeekly(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 2002 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(22); // 2002-2023
    });
  });

  describe('format support', () => {
    it('should load parquet format by default', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week\n2023,KC,1'));

      const result = await loadRostersWeekly(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });

    it('should load CSV format when specified', async () => {
      mockGet.mockResolvedValue({
        data: 'a,b\n1,2',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      await loadRostersWeekly(2023, { format: 'csv' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2002', async () => {
      const result = await loadRostersWeekly(2001);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('only available from 2002');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season', async () => {
      const result = await loadRostersWeekly(1998);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error when data not found', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadRostersWeekly(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadRostersWeekly(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should validate all seasons before loading', async () => {
      const result = await loadRostersWeekly([2020, 2001, 2021]);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('data passthrough', () => {
    it('should parse and combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(
          csvResponse(
            'season,team,week,full_name\n2021,KC,1,Patrick Mahomes\n2021,KC,2,Patrick Mahomes'
          )
        )
        .mockResolvedValueOnce(
          csvResponse('season,team,week,full_name\n2022,BUF,1,Josh Allen\n2022,BUF,2,Josh Allen')
        );

      const result = await loadRostersWeekly([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value[0]?.full_name).toBe('Patrick Mahomes');
        expect(result.value[2]?.team).toBe('BUF');
      }
    });
  });

  describe('URL building', () => {
    it('should build correct URL for weekly roster data', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team,week\n2023,KC,1'));

      await loadRostersWeekly(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/weekly_rosters\/roster_weekly_2023\.parquet$/),
        expect.any(Object)
      );
    });
  });
});
