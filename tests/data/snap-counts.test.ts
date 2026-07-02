/**
 * Tests for snap count data loading
 * @module data/snap-counts.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';

import { loadSnapCounts } from '../../src/data/snap-counts.js';

// Mock the HttpClient
const mockGet = vi.fn();
vi.mock('../../src/client/client.js', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

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

describe('loadSnapCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      mockGet.mockResolvedValue(
        csvResponse('game_id,season,week,player,team\n2023_01_DET_KC,2023,1,Test Player,KC')
      );

      const result = await loadSnapCounts();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('snap_counts_2023'),
        expect.any(Object)
      );
    });

    it('should load single season when number provided', async () => {
      mockGet.mockResolvedValue(csvResponse('game_id,season,week\n2022_01_BUF_LA,2022,1'));

      const result = await loadSnapCounts(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('snap_counts_2022'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons when array provided', async () => {
      mockGet.mockResolvedValue(csvResponse('game_id,season,week\n2021_01_DAL_TB,2021,1'));

      const result = await loadSnapCounts([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      mockGet.mockResolvedValue(csvResponse('game_id,season,week\n2020_01_HOU_KC,2020,1'));

      const result = await loadSnapCounts(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 2012 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(12); // 2012-2023
    });
  });

  describe('format support', () => {
    it('should load CSV format by default', async () => {
      mockGet.mockResolvedValue(csvResponse('game_id,season,week\n2023_01_DET_KC,2023,1'));

      const result = await loadSnapCounts(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should load parquet format when specified', async () => {
      mockGet.mockResolvedValue({
        data: new ArrayBuffer(100),
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      await loadSnapCounts(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2012', async () => {
      const result = await loadSnapCounts(2011);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('only available from 2012');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season', async () => {
      const result = await loadSnapCounts(1998);

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

      const result = await loadSnapCounts(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadSnapCounts(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should validate all seasons before loading', async () => {
      const result = await loadSnapCounts([2020, 2010, 2021]);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('data passthrough', () => {
    it('should parse and combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(
          csvResponse(
            'game_id,season,week,player,offense_snaps\n2021_01_CLE_KC,2021,1,Player A,60\n2021_01_CLE_KC,2021,1,Player B,45'
          )
        )
        .mockResolvedValueOnce(
          csvResponse(
            'game_id,season,week,player,offense_snaps\n2022_01_BUF_LA,2022,1,Player C,70\n2022_01_BUF_LA,2022,1,Player D,12'
          )
        );

      const result = await loadSnapCounts([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value[0]?.player).toBe('Player A');
        expect(result.value[0]?.offense_snaps).toBe(60);
        expect(result.value[2]?.season).toBe(2022);
      }
    });
  });

  describe('URL building', () => {
    it('should build correct URL for snap count data', async () => {
      mockGet.mockResolvedValue(csvResponse('game_id,season,week\n2023_01_DET_KC,2023,1'));

      await loadSnapCounts(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/snap_counts\/snap_counts_2023\.csv$/),
        expect.any(Object)
      );
    });
  });
});
