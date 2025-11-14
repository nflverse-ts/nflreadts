/**
 * Tests for depth chart data loading
 * @module data/depth-charts.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDepthCharts } from '../../src/data/depth-charts.js';
import { ValidationError } from '../../src/types/error.js';

// Mock the HttpClient
const mockGet = vi.fn();
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

describe('loadDepthCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse = {
        data: 'dt,team,player_name,pos_rank\n2024-09-05T12:00:00Z,KC,Patrick Mahomes,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0].player_name).toBe('Patrick Mahomes');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2024.csv'),
        expect.any(Object)
      );
    });

    it('should load specific season', async () => {
      const mockResponse = {
        data: 'dt,team,player_name,pos_rank\n2023-09-07T12:00:00Z,BUF,Josh Allen,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0].player_name).toBe('Josh Allen');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons', async () => {
      const mockResponse2022 = {
        data: 'dt,team,player_name,pos_rank\n2022-09-08T12:00:00Z,KC,Patrick Mahomes,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2023 = {
        data: 'dt,team,player_name,pos_rank\n2023-09-07T12:00:00Z,BUF,Josh Allen,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2022).mockResolvedValueOnce(mockResponse2023);

      const result = await loadDepthCharts([2022, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2022.csv'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load all seasons when true is passed', async () => {
      const mockResponse = {
        data: 'dt,team,player_name,pos_rank\n2024-09-05T12:00:00Z,KC,Patrick Mahomes,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const _result = await loadDepthCharts(true);

      // Should call for many seasons (2001-2024)
      expect(mockGet.mock.calls.length).toBeGreaterThan(20);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2001.csv'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2024.csv'),
        expect.any(Object)
      );
    });
  });

  describe('validation', () => {
    it('should reject seasons before 2001', async () => {
      const result = await loadDepthCharts(2000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('before the minimum season');
    });

    it('should reject future seasons', async () => {
      const result = await loadDepthCharts(2025);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('in the future');
    });

    it('should reject invalid season in array', async () => {
      const result = await loadDepthCharts([2023, 2025]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should accept 2001 (minimum valid season)', async () => {
      const mockResponse = {
        data: 'dt,team,player_name,pos_rank\n2001-09-09T12:00:00Z,NE,Tom Brady,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2001);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect((result.value[0]!.dt as unknown as Date).toISOString()).toBe(
        '2001-09-09T12:00:00.000Z'
      );
    });

    it('should accept current season (maximum valid season)', async () => {
      const mockResponse = {
        data: 'dt,team,player_name,pos_rank\n2024-09-05T12:00:00Z,KC,Patrick Mahomes,1',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2024);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect((result.value[0]!.dt as unknown as Date).toISOString()).toBe(
        '2024-09-05T12:00:00.000Z'
      );
    });
  });

  describe('format options', () => {
    it('should use CSV format by default', async () => {
      const mockResponse = {
        data: 'dt,team,player_name\n2023-09-07T12:00:00Z,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadDepthCharts(2023);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should use Parquet format when specified', async () => {
      const mockResponse = {
        data: new ArrayBuffer(0),
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      try {
        await loadDepthCharts(2023, { format: 'parquet' });
      } catch (error) {
        // Expected to fail due to empty buffer
      }

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return properly typed depth chart records', async () => {
      const mockCsvData = `dt,team,player_name,pos_grp,pos_name,pos_abb,pos_rank,gsis_id,espn_id,pos_grp_id,pos_id,pos_slot
2023-09-07T12:00:00Z,KC,Patrick Mahomes,OFFENSE,Quarterback,QB,1,00-0033873,3139477,OFF,QB,1`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);

      const entry = result.value[0]!;
      // dt is parsed as Date object by CSV parser with dynamicTyping
      expect(entry.dt).toBeInstanceOf(Date);
      expect((entry.dt as unknown as Date).toISOString()).toBe('2023-09-07T12:00:00.000Z');
      expect(entry.team).toBe('KC');
      expect(entry.player_name).toBe('Patrick Mahomes');
      expect(entry.pos_rank).toBe(1);
    });

    it('should handle multiple players at different positions', async () => {
      const mockCsvData = `dt,team,player_name,pos_rank
2023-09-07T12:00:00Z,KC,Patrick Mahomes,1
2023-09-07T12:00:00Z,KC,Travis Kelce,1
2023-09-07T12:00:00Z,KC,Chad Henne,2`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      expect(result.value[0]!.player_name).toBe('Patrick Mahomes');
      expect(result.value[1]!.player_name).toBe('Travis Kelce');
      expect(result.value[2]!.player_name).toBe('Chad Henne');
    });

    it('should handle null values correctly', async () => {
      const mockCsvData = `dt,team,player_name,espn_id,gsis_id
2023-09-07T12:00:00Z,KC,Patrick Mahomes,,`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0]!;
      expect(entry.espn_id).toBeNull();
      expect(entry.gsis_id).toBeNull();
    });
  });

  describe('parallel fetching', () => {
    it('should fetch multiple seasons in parallel', async () => {
      const mockResponse = {
        data: 'dt,team,player_name\n2023-09-07T12:00:00Z,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await loadDepthCharts([2021, 2022, 2023]);
      const endTime = Date.now();

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('data concatenation', () => {
    it('should correctly concatenate multiple seasons', async () => {
      const mockResponse2022 = {
        data: 'dt,team,player_name\n2022-09-08T12:00:00Z,KC,Patrick Mahomes\n2022-09-08T12:00:00Z,BUF,Josh Allen',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2023 = {
        data: 'dt,team,player_name\n2023-09-07T12:00:00Z,KC,Patrick Mahomes\n2023-09-07T12:00:00Z,BUF,Josh Allen\n2023-09-07T12:00:00Z,SF,Brock Purdy',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2022).mockResolvedValueOnce(mockResponse2023);

      const result = await loadDepthCharts([2022, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(5);

      // Check timestamps to determine which year
      const dt2022Count = result.value.filter(
        (r) => (r.dt as unknown as Date).getFullYear() === 2022
      ).length;
      const dt2023Count = result.value.filter(
        (r) => (r.dt as unknown as Date).getFullYear() === 2023
      ).length;
      expect(dt2022Count).toBe(2);
      expect(dt2023Count).toBe(3);
    });

    it('should handle empty datasets', async () => {
      const mockResponse = {
        data: 'dt,team,player_name\n',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDepthCharts(2023);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(0);
    });
  });

  describe('options', () => {
    it('should pass signal for cancellation', async () => {
      const mockResponse = {
        data: 'dt,team,player_name\n2023-09-07T12:00:00Z,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const controller = new AbortController();
      await loadDepthCharts(2023, { signal: controller.signal });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });
});
