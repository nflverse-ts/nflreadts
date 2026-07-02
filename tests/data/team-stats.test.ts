/**
 * Tests for team stats data loading
 * @module data/team-stats.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResponse } from '../../src/client/types.js';

import { loadTeamStats } from '../../src/data/team-stats.js';

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

describe('loadTeamStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2023,1,KC'));

      const result = await loadTeamStats();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('stats_team_week_2023'),
        expect.any(Object)
      );
    });

    it('should load single season when number provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2022,1,KC'));

      const result = await loadTeamStats(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('stats_team_week_2022'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons when array provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2021,1,KC'));

      const result = await loadTeamStats([2021, 2022]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should load all seasons when true provided', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2020,1,KC'));

      const result = await loadTeamStats(true);

      expect(result.ok).toBe(true);
      // Should load seasons from 1999 to current (2023 mocked)
      expect(mockGet).toHaveBeenCalledTimes(25); // 1999-2023
    });
  });

  describe('summary levels', () => {
    it('should load week level by default', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2023,1,KC'));

      await loadTeamStats(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/stats_team\/stats_team_week_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should load reg level when specified', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team\n2023,KC'));

      await loadTeamStats(2023, { summaryLevel: 'reg' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/stats_team\/stats_team_reg_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should map reg+post level to regpost file', async () => {
      mockGet.mockResolvedValue(csvResponse('season,team\n2023,KC'));

      await loadTeamStats(2023, { summaryLevel: 'reg+post' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/stats_team\/stats_team_regpost_2023\.csv$/),
        expect.any(Object)
      );
    });
  });

  describe('format support', () => {
    it('should load CSV format by default', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2023,1,KC'));

      const result = await loadTeamStats(2023);

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

      await loadTeamStats(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should return error for invalid season', async () => {
      const result = await loadTeamStats(1998);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
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

      const result = await loadTeamStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadTeamStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('data passthrough', () => {
    it('should parse and combine data from multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(
          csvResponse('season,week,team,passing_yards\n2021,1,KC,300\n2021,2,KC,250')
        )
        .mockResolvedValueOnce(
          csvResponse('season,week,team,passing_yards\n2022,1,KC,275\n2022,2,KC,310')
        );

      const result = await loadTeamStats([2021, 2022]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(4);
        expect(result.value[0]?.team).toBe('KC');
        expect(result.value[0]?.passing_yards).toBe(300);
      }
    });
  });

  describe('URL building', () => {
    it('should build correct URL for team stats data', async () => {
      mockGet.mockResolvedValue(csvResponse('season,week,team\n2023,1,KC'));

      await loadTeamStats(2023);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/stats_team\/stats_team_week_2023\.csv$/),
        expect.any(Object)
      );
    });
  });
});
