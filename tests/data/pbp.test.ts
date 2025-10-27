/**
 * Tests for play-by-play data loading
 * @module data/pbp.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';
import { loadPbp } from '../../src/data/pbp.js';

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

describe('loadPbp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('play_by_play_2023'));
    });

    it('should load single season when number provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2022',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('play_by_play_2022'));
    });

    it('should load multiple seasons when array provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2021\n2,2022',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2020',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 1999 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(25); // 1999-2023
    });
  });

  describe('format support', () => {
    it('should load CSV format by default', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2023',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'));
    });

    it('should load parquet format when specified', async () => {
      // Mock parquet data as ArrayBuffer
      const mockParquetData = new ArrayBuffer(100);

      const mockResponse: HttpResponse = {
        data: mockParquetData,
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadPbp(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'));
    });
  });

  describe('error handling', () => {
    it('should return error for invalid season', async () => {
      const result = await loadPbp(1998); // Before 1999

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

      const result = await loadPbp(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadPbp(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should fail fast when any season fails in multi-season request', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'play_id,season\n1,2021',
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

      const result = await loadPbp([2021, 2022]);

      expect(result.ok).toBe(false);
    });
  });

  describe('data combination', () => {
    it('should combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: 'play_id,season\n1,2021\n2,2021',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        })
        .mockResolvedValueOnce({
          data: 'play_id,season\n3,2022\n4,2022',
          status: 200,
          headers: {},
          fromCache: false,
          url: 'test-url',
        });

      const result = await loadPbp([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value[0]?.season).toBe(2021);
        expect(result.value[2]?.season).toBe(2022);
      }
    });
  });

  describe('validation', () => {
    it('should validate all seasons before loading', async () => {
      const result = await loadPbp([2020, 1995, 2021]); // 1995 is invalid

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should accept future season (current + 1)', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id,season\n1,2024',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPbp(2024); // 2024 is current + 1 (valid)

      expect(result.ok).toBe(true);
    });

    it('should reject season too far in future', async () => {
      const result = await loadPbp(2030);

      expect(result.ok).toBe(false);
    });
  });

  describe('URL building', () => {
    it('should build correct URL for play-by-play data', async () => {
      const mockResponse: HttpResponse = {
        data: 'play_id\n1',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadPbp(2023);

      expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/pbp\/play_by_play_2023\.csv$/));
    });
  });
});
