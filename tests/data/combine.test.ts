/**
 * Tests for combine data loading
 * @module data/combine.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadCombine } from '../../src/data/combine.js';
import { DataNotFoundError, ValidationError } from '../../src/types/error.js';

// Use vi.hoisted to declare mocks that will be used in vi.mock
const { mockGet, mockParseParquet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockParseParquet: vi.fn(),
}));

// Mock the HttpClient
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

// Mock parseParquet for parquet tests
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

describe('loadCombine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
  });

  // All combine history lives in a single file; loaders fetch once and filter
  const allSeasonsCsv = [
    'season,player_name,pos,school,ht,wt,forty',
    '2021,Kyle Pitts,TE,Florida,6-6,245,4.44',
    '2022,Aidan Hutchinson,DE,Michigan,6-7,260,4.74',
    '2022,Sauce Gardner,CB,Cincinnati,6-3,190,4.41',
    '2023,Bijan Robinson,RB,Texas,5-11,215,4.46',
  ].join('\n');

  const allSeasonsResponse = {
    data: allSeasonsCsv,
    status: 200,
    headers: { 'content-type': 'text/csv' },
    fromCache: false,
    url: 'test-url',
  };

  describe('default behavior', () => {
    it('should return the full file when no seasons provided (matches nflreadr)', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadCombine();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return the full file when true is passed', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadCombine(true);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season filtering', () => {
    it('should filter to a single season from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadCombine(2022);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.player_name).toBe('Aidan Hutchinson');
      expect(result.value.every((player) => player.season === 2022)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should filter to multiple seasons from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadCombine([2021, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2021);
      expect(result.value[1]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL building', () => {
    it('should fetch from the real combine release URL', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      await loadCombine();

      expect(mockGet).toHaveBeenCalledWith(
        'https://github.com/nflverse/nflverse-data/releases/download/combine/combine.csv',
        expect.any(Object)
      );
    });
  });

  describe('format options', () => {
    it('should load CSV format by default', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadCombine(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should load Parquet format when specified', async () => {
      const mockResponse = {
        data: new ArrayBuffer(100),
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);
      mockParseParquet.mockResolvedValue([
        { season: 2022, player_name: 'Sauce Gardner', pos: 'CB' },
      ]);

      const result = await loadCombine(2022, { format: 'parquet' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('validation', () => {
    it('should return error for season before 2000', async () => {
      const result = await loadCombine(1999);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 1999');
      expect(result.error.message).toContain('Must be between 2000');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season in array', async () => {
      const result = await loadCombine([2022, 1999]);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  describe('data structure', () => {
    it('should parse typed values and nulls for skipped drills', async () => {
      const mockResponse = {
        data: [
          'season,draft_year,draft_team,draft_round,draft_ovr,player_name,pos,ht,wt,forty,bench,vertical',
          '2000,2000,New York Jets,1,13,John Abraham,OLB,6-4,252,4.55,,',
        ].join('\n'),
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadCombine(2000);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const player = result.value[0]!;
      expect(player.season).toBe(2000);
      expect(player.draft_team).toBe('New York Jets');
      expect(player.draft_ovr).toBe(13);
      expect(player.player_name).toBe('John Abraham');
      expect(player.ht).toBe('6-4');
      expect(player.wt).toBe(252);
      expect(player.forty).toBe(4.55);
      expect(player.bench).toBeNull();
      expect(player.vertical).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadCombine(2022);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('Network error');
    });

    it('should return DataNotFoundError on 404 response', async () => {
      mockGet.mockResolvedValue({
        data: '',
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadCombine(2022);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(DataNotFoundError);
      expect(result.error.message).toContain('Data not found');
    });
  });
});
