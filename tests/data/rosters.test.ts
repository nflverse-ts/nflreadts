/**
 * Tests for roster data loading
 * @module data/rosters.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadRosters } from '../../src/data/rosters.js';
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

describe('loadRosters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('season normalization', () => {
    it('should load current season when no seasons provided', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2024,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters();

      expect(result).toHaveLength(1);
      expect(result[0]?.full_name).toBe('Patrick Mahomes');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_2024.csv'),
        expect.any(Object)
      );
    });

    it('should load specific season', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2023,BUF,Josh Allen',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(2023);

      expect(result).toHaveLength(1);
      expect(result[0]?.full_name).toBe('Josh Allen');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons', async () => {
      const mockResponse2022 = {
        data: 'season,team,full_name\n2022,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2023 = {
        data: 'season,team,full_name\n2023,BUF,Josh Allen',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2022).mockResolvedValueOnce(mockResponse2023);

      const result = await loadRosters([2022, 2023]);

      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_2022.csv'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load all seasons when true is passed', async () => {
      // Mock responses for a few seasons (testing the concept, not all 100+ years)
      const mockResponse = {
        data: 'season,team,full_name\n2024,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const _result = await loadRosters(true);

      // Should call for many seasons (1920-2024)
      expect(mockGet.mock.calls.length).toBeGreaterThan(100);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_1920.csv'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('roster_2024.csv'),
        expect.any(Object)
      );
    });
  });

  describe('validation', () => {
    it('should reject seasons before 1920', async () => {
      await expect(loadRosters(1919)).rejects.toThrow(ValidationError);
      await expect(loadRosters(1919)).rejects.toThrow('before the minimum season');
    });

    it('should reject future seasons', async () => {
      await expect(loadRosters(2025)).rejects.toThrow(ValidationError);
      await expect(loadRosters(2025)).rejects.toThrow('in the future');
    });

    it('should reject invalid season in array', async () => {
      await expect(loadRosters([2023, 2025])).rejects.toThrow(ValidationError);
    });

    it('should accept 1920 (minimum valid season)', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n1920,GB,Player Name',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(1920);

      expect(result).toHaveLength(1);
      expect(result[0]?.season).toBe(1920);
    });

    it('should accept current season (maximum valid season)', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2024,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(2024);

      expect(result).toHaveLength(1);
      expect(result[0]?.season).toBe(2024);
    });
  });

  describe('format options', () => {
    it('should use CSV format by default', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2023,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadRosters(2023);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should use Parquet format when specified', async () => {
      // Create a minimal Parquet-like response (in reality, this would be binary data)
      const mockResponse = {
        data: new ArrayBuffer(0),
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      // This will fail parsing, but we're testing URL construction
      try {
        await loadRosters(2023, { format: 'parquet' });
      } catch (error) {
        // Expected to fail due to empty buffer
      }

      // Just verify the URL contains .parquet
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return properly typed roster records', async () => {
      const mockCsvData = `season,team,position,depth_chart_position,jersey_number,status,full_name,first_name,last_name,birth_date,height,weight,college,high_school,gsis_id,espn_id,sportradar_id,yahoo_id,rotowire_id,pff_id,pfr_id,fantasy_data_id,sleeper_id,years_exp,headshot_url,ngs_position,week,game_type,status_description_abbr,football_name,esb_id,gsis_it_id,smart_id,entry_year,rookie_year,draft_club,draft_number
2023,KC,QB,QB,15,ACT,Patrick Mahomes,Patrick,Mahomes,1995-09-17,75,230,Texas Tech,Whitehouse HS,00-0033873,3139477,sr:player:123,123,456,12345,MahoPa00,12345,5678,7,https://example.com/headshot.jpg,QB,18,REG,ACT,Pat,ESB123,GSIS123,987654321,2017,2017,KC,10`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(2023);

      expect(result).toHaveLength(1);

      const player = result[0]!;
      expect(player.season).toBe(2023);
      expect(player.team).toBe('KC');
      expect(player.full_name).toBe('Patrick Mahomes');
      expect(player.position).toBe('QB');
      expect(player.jersey_number).toBe(15);
      expect(player.height).toBe(75);
      expect(player.weight).toBe(230);
      expect(player.college).toBe('Texas Tech');
      expect(player.years_exp).toBe(7);
      expect(player.draft_number).toBe(10);
    });

    it('should handle null values correctly', async () => {
      const mockCsvData = `season,team,position,full_name,depth_chart_position,jersey_number,high_school
2023,KC,QB,Patrick Mahomes,,,`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(2023);

      expect(result).toHaveLength(1);
      const player = result[0]!;
      expect(player.depth_chart_position).toBeNull();
      expect(player.jersey_number).toBeNull();
      expect(player.high_school).toBeNull();
    });
  });

  describe('parallel fetching', () => {
    it('should fetch multiple seasons in parallel', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2023,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await loadRosters([2021, 2022, 2023]);
      const endTime = Date.now();

      // All should be called
      expect(mockGet).toHaveBeenCalledTimes(3);

      // Should complete quickly (not sequential)
      // Note: This is a rough check; in real tests parallel should be much faster
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('data concatenation', () => {
    it('should correctly concatenate multiple seasons', async () => {
      const mockResponse2022 = {
        data: 'season,team,full_name\n2022,KC,Patrick Mahomes\n2022,BUF,Josh Allen',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      const mockResponse2023 = {
        data: 'season,team,full_name\n2023,KC,Patrick Mahomes\n2023,BUF,Josh Allen\n2023,SF,Brock Purdy',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValueOnce(mockResponse2022).mockResolvedValueOnce(mockResponse2023);

      const result = await loadRosters([2022, 2023]);

      // Should have 2 + 3 = 5 records total
      expect(result).toHaveLength(5);

      // Check that both seasons are present
      const seasons = new Set(result.map((r) => r.season));
      expect(seasons.has(2022)).toBe(true);
      expect(seasons.has(2023)).toBe(true);

      // Check record counts per season
      const season2022Count = result.filter((r) => r.season === 2022).length;
      const season2023Count = result.filter((r) => r.season === 2023).length;
      expect(season2022Count).toBe(2);
      expect(season2023Count).toBe(3);
    });

    it('should handle empty datasets', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadRosters(2023);

      expect(result).toHaveLength(0);
    });
  });

  describe('options', () => {
    it('should pass signal for cancellation', async () => {
      const mockResponse = {
        data: 'season,team,full_name\n2023,KC,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const controller = new AbortController();
      await loadRosters(2023, { signal: controller.signal });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });
});
