/**
 * Tests for draft pick data loading
 * @module data/draft-picks.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDraftPicks } from '../../src/data/draft-picks.js';
import { DataNotFoundError, ValidationError } from '../../src/types/error.js';
import { parseCsv } from '../../src/utils/parse.js';

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

describe('loadDraftPicks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
    // Fixtures are CSV strings; route the parquet default path through the
    // real CSV parser so both format branches share the same fixtures.
    mockParseParquet.mockImplementation((buffer: ArrayBuffer | string) => {
      const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
      return Promise.resolve(parseCsv(text).data);
    });
  });

  // All draft history lives in a single file; loaders fetch once and filter
  const allSeasonsCsv = [
    'season,round,pick,team,pfr_player_name,position,hof',
    '2020,1,1,CIN,Joe Burrow,QB,FALSE',
    '2021,1,1,JAX,Trevor Lawrence,QB,FALSE',
    '2021,1,2,NYJ,Zach Wilson,QB,FALSE',
    '2022,1,1,JAX,Travon Walker,DE,FALSE',
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

      const result = await loadDraftPicks();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return the full file when true is passed', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadDraftPicks(true);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season filtering', () => {
    it('should filter to a single season from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadDraftPicks(2021);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.pfr_player_name).toBe('Trevor Lawrence');
      expect(result.value.every((pick) => pick.season === 2021)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should filter to multiple seasons from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadDraftPicks([2020, 2022]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2020);
      expect(result.value[1]?.season).toBe(2022);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL building', () => {
    it('should fetch from the real draft_picks release URL', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      await loadDraftPicks();

      expect(mockGet).toHaveBeenCalledWith(
        'https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.parquet',
        expect.any(Object)
      );
    });
  });

  describe('format options', () => {
    it('should load parquet format by default', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadDraftPicks(2021);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });

    it('should load CSV format when specified', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadDraftPicks(2021, { format: 'csv' });

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
        { season: 2021, round: 1, pick: 1, team: 'JAX', pfr_player_name: 'Trevor Lawrence' },
      ]);

      const result = await loadDraftPicks(2021, { format: 'parquet' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('validation', () => {
    it('should return error for season before 1980', async () => {
      const result = await loadDraftPicks(1979);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 1979');
      expect(result.error.message).toContain('Must be between 1980');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season in array', async () => {
      const result = await loadDraftPicks([2021, 1979]);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  describe('data structure', () => {
    it('should parse typed values and nulls for missing career stats', async () => {
      const mockResponse = {
        data: [
          'season,round,pick,team,pfr_player_name,position,hof,age,w_av,def_sacks',
          '2020,1,1,CIN,Joe Burrow,QB,FALSE,23,45,',
        ].join('\n'),
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadDraftPicks(2020);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const pick = result.value[0]!;
      expect(pick.season).toBe(2020);
      expect(pick.round).toBe(1);
      expect(pick.pick).toBe(1);
      expect(pick.team).toBe('CIN');
      expect(pick.pfr_player_name).toBe('Joe Burrow');
      expect(pick.hof).toBe(false);
      expect(pick.age).toBe(23);
      expect(pick.w_av).toBe(45);
      expect(pick.def_sacks).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadDraftPicks(2021);

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

      const result = await loadDraftPicks(2021);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(DataNotFoundError);
      expect(result.error.message).toContain('Data not found');
    });
  });

  describe('options', () => {
    it('should pass signal to HttpClient for request cancellation', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const controller = new AbortController();
      const result = await loadDraftPicks(2021, { signal: controller.signal });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });
});
