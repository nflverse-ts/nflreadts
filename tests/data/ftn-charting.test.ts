/**
 * Tests for FTN charting data loading
 * @module data/ftn-charting.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';

import { loadFtnCharting } from '../../src/data/ftn-charting.js';

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

describe('loadFtnCharting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      mockGet.mockResolvedValue(
        csvResponse('nflverse_game_id,season,week,is_motion\n2023_01_DET_KC,2023,1,TRUE')
      );

      const result = await loadFtnCharting();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('ftn_charting_2023'),
        expect.any(Object)
      );
    });

    it('should load single season when number provided', async () => {
      mockGet.mockResolvedValue(csvResponse('nflverse_game_id,season,week\n2022_01_BUF_LA,2022,1'));

      const result = await loadFtnCharting(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('ftn_charting_2022'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons when array provided', async () => {
      mockGet.mockResolvedValue(csvResponse('nflverse_game_id,season,week\n2022_01_BUF_LA,2022,1'));

      const result = await loadFtnCharting([2022, 2023]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      mockGet.mockResolvedValue(csvResponse('nflverse_game_id,season,week\n2022_01_BUF_LA,2022,1'));

      const result = await loadFtnCharting(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 2022 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(2); // 2022-2023
    });
  });

  describe('format support', () => {
    it('should load CSV format by default', async () => {
      mockGet.mockResolvedValue(csvResponse('nflverse_game_id,season,week\n2023_01_DET_KC,2023,1'));

      const result = await loadFtnCharting(2023);

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

      await loadFtnCharting(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2022', async () => {
      const result = await loadFtnCharting(2021);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('only available from 2022');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season', async () => {
      const result = await loadFtnCharting(1998);

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

      const result = await loadFtnCharting(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadFtnCharting(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should validate all seasons before loading', async () => {
      const result = await loadFtnCharting([2022, 2019, 2023]);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('data passthrough', () => {
    it('should parse and combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(
          csvResponse(
            'nflverse_game_id,season,week,is_play_action,n_pass_rushers\n2022_01_BUF_LA,2022,1,TRUE,4\n2022_01_BUF_LA,2022,1,FALSE,5'
          )
        )
        .mockResolvedValueOnce(
          csvResponse(
            'nflverse_game_id,season,week,is_play_action,n_pass_rushers\n2023_01_DET_KC,2023,1,FALSE,3\n2023_01_DET_KC,2023,1,TRUE,6'
          )
        );

      const result = await loadFtnCharting([2022, 2023]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value[0]?.is_play_action).toBe(true);
        expect(result.value[0]?.n_pass_rushers).toBe(4);
        expect(result.value[2]?.season).toBe(2023);
      }
    });
  });

  describe('URL building', () => {
    it('should build correct URL for FTN charting data', async () => {
      mockGet.mockResolvedValue(csvResponse('nflverse_game_id,season,week\n2023_01_DET_KC,2023,1'));

      await loadFtnCharting(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/ftn_charting\/ftn_charting_2023\.csv$/),
        expect.any(Object)
      );
    });
  });
});
