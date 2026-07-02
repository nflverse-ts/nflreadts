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

const csvResponse = (data: string) => ({
  data,
  status: 200,
  headers: { 'content-type': 'text/csv' },
  fromCache: false,
  url: 'test-url',
});

describe('loadPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('basic loading', () => {
    it('should load player data successfully', async () => {
      mockGet.mockResolvedValue(
        csvResponse('gsis_id,display_name,position\n00-0033873,Patrick Mahomes,QB')
      );

      const result = await loadPlayers({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0].display_name).toBe('Patrick Mahomes');
      expect(result.value[0].gsis_id).toBe('00-0033873');
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for empty dataset', async () => {
      mockGet.mockResolvedValue(csvResponse('gsis_id,display_name,position\n'));

      const result = await loadPlayers({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(0);
    });
  });

  describe('format options', () => {
    it('should use Parquet format by default', async () => {
      mockGet.mockResolvedValue({
        data: new ArrayBuffer(0),
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      });

      // Parsing the empty buffer fails, but we're testing URL construction
      await loadPlayers();

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });

    it('should use CSV format when specified', async () => {
      mockGet.mockResolvedValue(csvResponse('gsis_id,display_name\n00-0033873,Patrick Mahomes'));

      await loadPlayers({ format: 'csv' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return properly typed player records', async () => {
      const header =
        'gsis_id,display_name,common_first_name,first_name,last_name,short_name,football_name,suffix,' +
        'esb_id,nfl_id,pfr_id,pff_id,otc_id,espn_id,smart_id,birth_date,position_group,position,' +
        'ngs_position_group,ngs_position,height,weight,headshot,college_name,college_conference,' +
        'jersey_number,rookie_season,last_season,latest_team,status,ngs_status,' +
        'ngs_status_short_description,years_of_experience,pff_position,pff_status,' +
        'draft_year,draft_round,draft_pick,draft_team';
      const row =
        '00-0033873,Patrick Mahomes,Patrick,Patrick,Mahomes,P.Mahomes,Patrick,,' +
        'MAH473116,43290,MahoPa00,11765,2325,3139477,32004d41-4847-3116-b5e9-7e4d37c4b418,' +
        '1995-09-17,QB,QB,QB,QB,74,225,https://example.com/mahomes.png,Texas Tech,Big 12 Conference,' +
        '15,2017,2026,KC,ACT,ACT,Active,10,QB,A,2017,1,10,KC';

      mockGet.mockResolvedValue(csvResponse(`${header}\n${row}`));

      const result = await loadPlayers({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);

      const player = result.value[0];
      expect(player.gsis_id).toBe('00-0033873');
      expect(player.display_name).toBe('Patrick Mahomes');
      expect(player.common_first_name).toBe('Patrick');
      expect(player.position).toBe('QB');
      expect(player.espn_id).toBe(3139477);
      expect(player.nfl_id).toBe(43290);
      expect(player.college_name).toBe('Texas Tech');
      expect(player.college_conference).toBe('Big 12 Conference');
      expect(player.rookie_season).toBe(2017);
      expect(player.latest_team).toBe('KC');
      expect(player.years_of_experience).toBe(10);
      expect(player.draft_year).toBe(2017);
      expect(player.draft_round).toBe(1);
      expect(player.draft_pick).toBe(10);
      expect(player.draft_team).toBe('KC');
    });

    it('should handle multiple players', async () => {
      const mockCsvData = `gsis_id,display_name,position
00-0033873,Patrick Mahomes,QB
00-0036212,Josh Allen,QB
00-0036945,Lamar Jackson,QB`;

      mockGet.mockResolvedValue(csvResponse(mockCsvData));

      const result = await loadPlayers({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      expect(result.value[0].display_name).toBe('Patrick Mahomes');
      expect(result.value[1].display_name).toBe('Josh Allen');
      expect(result.value[2].display_name).toBe('Lamar Jackson');
    });

    it('should handle null values correctly', async () => {
      const mockCsvData = `gsis_id,display_name,college_name,draft_year
00-0033873,Patrick Mahomes,,`;

      mockGet.mockResolvedValue(csvResponse(mockCsvData));

      const result = await loadPlayers({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const player = result.value[0];
      expect(player.college_name).toBeNull();
      expect(player.draft_year).toBeNull();
    });
  });

  describe('options', () => {
    it('should pass signal for cancellation', async () => {
      mockGet.mockResolvedValue(csvResponse('gsis_id,display_name\n00-0033873,Patrick Mahomes'));

      const controller = new AbortController();
      await loadPlayers({ format: 'csv', signal: controller.signal });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });
});
