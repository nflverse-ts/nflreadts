/**
 * Tests for player data loading
 * @module data/players.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPlayers } from '../../src/data/players.js';

// Mock the HttpClient
const mockGet = vi.fn();
vi.mock('../../src/client/client.js', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

describe('loadPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('basic loading', () => {
    it('should load player data successfully', async () => {
      const mockResponse = {
        data: 'gsis_id,display_name,position\n00-0033873,Patrick Mahomes,QB',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayers();

      expect(result).toHaveLength(1);
      expect(result[0].display_name).toBe('Patrick Mahomes');
      expect(result[0].gsis_id).toBe('00-0033873');
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for empty dataset', async () => {
      const mockResponse = {
        data: 'gsis_id,display_name,position\n',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayers();

      expect(result).toHaveLength(0);
    });
  });

  describe('format options', () => {
    it('should use CSV format by default', async () => {
      const mockResponse = {
        data: 'gsis_id,display_name\n00-0033873,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      await loadPlayers();

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

      // This will fail parsing empty buffer, but we're testing URL construction
      try {
        await loadPlayers({ format: 'parquet' });
      } catch (error) {
        // Expected to fail due to empty buffer
      }

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return properly typed player records', async () => {
      const mockCsvData = `gsis_id,espn_id,pff_id,pfr_id,display_name,first_name,last_name,position,position_group,draft_year,draft_round,draft_pick,college,high_school,height,weight,birth_date
00-0033873,3139477,12345,MahoPa00,Patrick Mahomes,Patrick,Mahomes,QB,QB,2017,1,10,Texas Tech,Whitehouse HS,74,230,1995-09-17`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayers();

      expect(result).toHaveLength(1);

      const player = result[0];
      expect(player.gsis_id).toBe('00-0033873');
      expect(player.display_name).toBe('Patrick Mahomes');
      expect(player.position).toBe('QB');
      expect(player.draft_year).toBe(2017);
      expect(player.draft_round).toBe(1);
      expect(player.draft_pick).toBe(10);
      expect(player.college).toBe('Texas Tech');
    });

    it('should handle multiple players', async () => {
      const mockCsvData = `gsis_id,display_name,position
00-0033873,Patrick Mahomes,QB
00-0036212,Josh Allen,QB
00-0036945,Lamar Jackson,QB`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayers();

      expect(result).toHaveLength(3);
      expect(result[0].display_name).toBe('Patrick Mahomes');
      expect(result[1].display_name).toBe('Josh Allen');
      expect(result[2].display_name).toBe('Lamar Jackson');
    });

    it('should handle null values correctly', async () => {
      const mockCsvData = `gsis_id,display_name,college,draft_year
00-0033873,Patrick Mahomes,,`;

      const mockResponse = {
        data: mockCsvData,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadPlayers();

      expect(result).toHaveLength(1);
      const player = result[0];
      expect(player.college).toBeNull();
      expect(player.draft_year).toBeNull();
    });
  });

  describe('options', () => {
    it('should pass signal for cancellation', async () => {
      const mockResponse = {
        data: 'gsis_id,display_name\n00-0033873,Patrick Mahomes',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const controller = new AbortController();
      await loadPlayers({ signal: controller.signal });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });
});
