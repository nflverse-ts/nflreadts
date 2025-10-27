/**
 * Tests for participation data loading
 * @module data/participation.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';

import { loadParticipation } from '../../src/data/participation.js';

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

describe('loadParticipation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id,possession_team\n2023_01_KC_PHI,1,KC',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('participation_2023'));
    });

    it('should load single season when number provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id\n2022_01_KC_PHI,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('participation_2022'));
    });

    it('should load multiple seasons when array provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id\n2021_01_KC_PHI,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id\n2020_01_KC_PHI,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 2016 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(8); // 2016-2023
    });
  });

  describe('format support', () => {
    it('should load CSV format by default', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id\n2023_01_KC_PHI,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'));
    });

    it('should load parquet format when specified', async () => {
      const mockParquetData = new ArrayBuffer(100);

      const mockResponse: HttpResponse = {
        data: mockParquetData,
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadParticipation(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'));
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2016', async () => {
      const result = await loadParticipation(2015);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('only available from 2016');
      }
    });

    it('should return error for invalid season', async () => {
      const result = await loadParticipation(1998);

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

      const result = await loadParticipation(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadParticipation(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should fail fast when any season fails in multi-season request', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'nflverse_game_id,play_id\n2021_01_KC_PHI,1',
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

      const result = await loadParticipation([2021, 2022]);

      expect(result.ok).toBe(false);
    });
  });

  describe('data combination', () => {
    it('should combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'nflverse_game_id,play_id\n2021_01_KC_PHI,1\n2021_01_KC_PHI,2',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        })
        .mockResolvedValueOnce({
          data: 'nflverse_game_id,play_id\n2022_01_KC_PHI,1\n2022_01_KC_PHI,2',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        });

      const result = await loadParticipation([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
      }
    });
  });

  describe('validation', () => {
    it('should validate all seasons before loading', async () => {
      const result = await loadParticipation([2020, 1995, 2021]);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should accept future season (current + 1)', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id,play_id\n2024_01_KC_PHI,1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadParticipation(2024);

      expect(result.ok).toBe(true);
    });

    it('should reject season too far in future', async () => {
      const result = await loadParticipation(2030);

      expect(result.ok).toBe(false);
    });
  });

  describe('URL building', () => {
    it('should build correct URL for participation data', async () => {
      const mockResponse: HttpResponse = {
        data: 'nflverse_game_id\n2023_01_KC_PHI',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadParticipation(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/participation\/participation_2023\.csv$/)
      );
    });
  });
});
