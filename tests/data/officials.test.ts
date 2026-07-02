/**
 * Tests for officials data loading
 * @module data/officials.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadOfficials } from '../../src/data/officials.js';
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

describe('loadOfficials', () => {
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

  // All seasons live in a single file; loaders fetch once and filter
  const allSeasonsCsv = [
    'game_id,game_key,official_name,position,jersey_number,official_id,season,season_type,week',
    '2021091200,58001,Shawn Hochuli,Referee,83,101,2021,REG,1',
    '2022091100,59001,Brad Rogers,Referee,126,102,2022,REG,1',
    '2022091100,59001,Kent Payne,Head Linesman,79,28,2022,REG,1',
    '2023091000,60001,Carl Cheffers,Referee,51,103,2023,REG,1',
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

      const result = await loadOfficials();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return the full file when true is passed', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadOfficials(true);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season filtering', () => {
    it('should filter to a single season from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadOfficials(2022);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.official_name).toBe('Brad Rogers');
      expect(result.value.every((official) => official.season === 2022)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should filter to multiple seasons from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadOfficials([2021, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2021);
      expect(result.value[1]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL building', () => {
    it('should fetch from the real officials release URL', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      await loadOfficials();

      expect(mockGet).toHaveBeenCalledWith(
        'https://github.com/nflverse/nflverse-data/releases/download/officials/officials.parquet',
        expect.any(Object)
      );
    });
  });

  describe('format options', () => {
    it('should load parquet format by default', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadOfficials(2022);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });

    it('should load CSV format when specified', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadOfficials(2022, { format: 'csv' });

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
        { game_id: 2022091100, official_name: 'Brad Rogers', season: 2022 },
      ]);

      const result = await loadOfficials(2022, { format: 'parquet' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('validation', () => {
    it('should return error for season before 2015', async () => {
      const result = await loadOfficials(2014);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 2014');
      expect(result.error.message).toContain('Must be between 2015');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season in array', async () => {
      const result = await loadOfficials([2022, 2014]);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  describe('data structure', () => {
    it('should return official records with proper structure', async () => {
      const mockResponse = {
        data: [
          'game_id,game_key,official_name,position,jersey_number,official_id,season,season_type,week',
          '2015091000,56503,Brad Freeman,Field Judge,88,25,2015,REG,1',
        ].join('\n'),
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadOfficials(2015);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const official = result.value[0]!;
      expect(official.game_id).toBe(2015091000);
      expect(official.game_key).toBe(56503);
      expect(official.official_name).toBe('Brad Freeman');
      expect(official.position).toBe('Field Judge');
      expect(official.jersey_number).toBe(88);
      expect(official.official_id).toBe(25);
      expect(official.season).toBe(2015);
      expect(official.season_type).toBe('REG');
      expect(official.week).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadOfficials(2022);

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

      const result = await loadOfficials(2022);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(DataNotFoundError);
      expect(result.error.message).toContain('Data not found');
    });
  });
});
