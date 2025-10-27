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
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('player_stats_2023'));
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
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('player_stats_2022'));
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
    it('should load CSV format by default', async () => {
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

      await loadPlayerStats(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'));
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

  describe('summary level aggregation', () => {
    it('should return weekly data unchanged for week level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,season,week,passing_yards\n00-0012345,2023,1,300\n00-0012345,2023,2,250',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'week' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0]?.week).toBe(1);
        expect(result.value[1]?.week).toBe(2);
      }
    });

    it('should aggregate stats for reg level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards,passing_tds\n00-0012345,P.Mahomes,2023,1,300,2\n00-0012345,P.Mahomes,2023,2,250,3',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be aggregated to 1 record per player
        expect(result.value.length).toBe(1);
        expect(result.value[0]?.week).toBeNull(); // Aggregated records have no week
        expect(result.value[0]?.passing_yards).toBe(550); // 300 + 250
        expect(result.value[0]?.passing_tds).toBe(5); // 2 + 3
      }
    });

    it('should filter and aggregate regular season only for reg level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards\n00-0012345,P.Mahomes,2023,1,300\n00-0012345,P.Mahomes,2023,18,250\n00-0012345,P.Mahomes,2023,19,400',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        // Should only include weeks 1-18, exclude week 19 (postseason)
        expect(result.value[0]?.passing_yards).toBe(550); // 300 + 250, not including 400
      }
    });

    it('should filter and aggregate postseason only for post level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards\n00-0012345,P.Mahomes,2023,18,300\n00-0012345,P.Mahomes,2023,19,250\n00-0012345,P.Mahomes,2023,20,400',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'post' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        // Should only include weeks 19+, exclude week 18
        expect(result.value[0]?.passing_yards).toBe(650); // 250 + 400, not including 300
      }
    });

    it('should aggregate all weeks for reg+post level', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards\n00-0012345,P.Mahomes,2023,1,100\n00-0012345,P.Mahomes,2023,18,200\n00-0012345,P.Mahomes,2023,19,300',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg+post' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        // Should include all weeks
        expect(result.value[0]?.passing_yards).toBe(600); // 100 + 200 + 300
      }
    });

    it('should aggregate multiple players separately', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards\n00-0012345,P.Mahomes,2023,1,300\n00-0012345,P.Mahomes,2023,2,250\n00-0023456,J.Allen,2023,1,280\n00-0023456,J.Allen,2023,2,310',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2); // 2 players

        // Find each player's stats
        const mahomes = result.value.find((p) => p.player_id === '00-0012345');
        const allen = result.value.find((p) => p.player_id === '00-0023456');

        expect(mahomes?.passing_yards).toBe(550); // 300 + 250
        expect(allen?.passing_yards).toBe(590); // 280 + 310
      }
    });

    it('should aggregate all stat types correctly', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards,rushing_yards,receptions,def_tackles_solo,fg_made,fg_att\n00-0012345,Player,2023,1,100,50,5,3,2,3\n00-0012345,Player,2023,2,200,75,8,4,1,2',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        const player = result.value[0];

        // Verify different stat types are all summed correctly
        expect(player.passing_yards).toBe(300); // 100 + 200
        expect(player.rushing_yards).toBe(125); // 50 + 75
        expect(player.receptions).toBe(13); // 5 + 8
        expect(player.def_tackles_solo).toBe(7); // 3 + 4
        expect(player.fg_made).toBe(3); // 2 + 1
        expect(player.fg_att).toBe(5); // 3 + 2
        // FG percentage should be recalculated
        expect(player.fg_pct).toBeCloseTo(0.6, 2); // 3/5 = 0.6
      }
    });

    it('should handle null/missing values in aggregation', async () => {
      const mockResponse: HttpResponse = {
        data: 'player_id,player_name,season,week,passing_yards,rushing_yards\n00-0012345,Player,2023,1,100,\n00-0012345,Player,2023,2,200,50',
        status: 200,
        headers: {},
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayerStats(2023, { summaryLevel: 'reg' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        expect(result.value[0]?.passing_yards).toBe(300); // 100 + 200
        expect(result.value[0]?.rushing_yards).toBe(50); // 0 (null) + 50
      }
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
        expect.stringMatching(/player_stats\/player_stats_2023\.csv$/)
      );
    });
  });
});
