/**
 * Tests for trade data loading
 * @module data/trades.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadTrades } from '../../src/data/trades.js';
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

describe('loadTrades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
  });

  // All seasons live in a single file; loaders fetch once and filter
  const allSeasonsCsv = [
    'trade_id,season,trade_date,gave,received,pick_season,pick_round,pick_number,conditional,pfr_id,pfr_name',
    '1500,2021,2021-03-17,DET,LA,,,,,StafMa00,Matthew Stafford',
    '1600,2022,2022-03-08,SEA,DEN,,,,,WilsRu00,Russell Wilson',
    '1600,2022,2022-03-08,DEN,SEA,2022,1,9,0,,',
    '1700,2023,2023-03-15,CAR,CHI,2023,1,1,0,,',
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

      const result = await loadTrades();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return the full file when true is passed', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadTrades(true);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(4);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season filtering', () => {
    it('should filter to a single season from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadTrades(2022);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.pfr_name).toBe('Russell Wilson');
      expect(result.value.every((trade) => trade.season === 2022)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should filter to multiple seasons from the single file', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadTrades([2021, 2023]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.season).toBe(2021);
      expect(result.value[1]?.season).toBe(2023);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL building', () => {
    it('should fetch from the real trades release URL', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      await loadTrades();

      expect(mockGet).toHaveBeenCalledWith(
        'https://github.com/nflverse/nflverse-data/releases/download/trades/trades.csv',
        expect.any(Object)
      );
    });
  });

  describe('format options', () => {
    it('should load CSV format by default', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadTrades(2022);

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
        { trade_id: 1600, season: 2022, gave: 'SEA', received: 'DEN' },
      ]);

      const result = await loadTrades(2022, { format: 'parquet' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('validation', () => {
    it('should return error for season before 2002', async () => {
      const result = await loadTrades(2001);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('Invalid season: 2001');
      expect(result.error.message).toContain('Must be between 2002');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for invalid season in array', async () => {
      const result = await loadTrades([2022, 2001]);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });

  describe('data structure', () => {
    it('should parse player rows and pick rows with nulls for absent fields', async () => {
      mockGet.mockResolvedValue(allSeasonsResponse);

      const result = await loadTrades(2022);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Rows of the same trade share a trade_id
      const playerRow = result.value[0]!;
      const pickRow = result.value[1]!;
      expect(playerRow.trade_id).toBe(1600);
      expect(pickRow.trade_id).toBe(1600);

      // Player asset: pick fields are null
      expect(playerRow.gave).toBe('SEA');
      expect(playerRow.received).toBe('DEN');
      expect(playerRow.trade_date).toBe('2022-03-08');
      expect(playerRow.pfr_id).toBe('WilsRu00');
      expect(playerRow.pick_season).toBeNull();
      expect(playerRow.pick_round).toBeNull();

      // Pick asset: player fields are null
      expect(pickRow.pick_season).toBe(2022);
      expect(pickRow.pick_round).toBe(1);
      expect(pickRow.pick_number).toBe(9);
      expect(pickRow.conditional).toBe(0);
      expect(pickRow.pfr_id).toBeNull();
      expect(pickRow.pfr_name).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadTrades(2022);

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

      const result = await loadTrades(2022);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(DataNotFoundError);
      expect(result.error.message).toContain('Data not found');
    });
  });
});
