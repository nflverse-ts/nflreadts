/**
 * Tests for Next Gen Stats data loading
 * @module data/nextgen-stats.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadNextgenStats } from '../../src/data/nextgen-stats.js';

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

// Mock parseParquet (Next Gen Stats are parquet-only)
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

const parquetResponse = {
  data: new ArrayBuffer(100),
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
};

// The single NGS file spans all seasons; week 0 rows are season aggregates
const allSeasonsRecords = [
  { season: 2016, week: 0, player_display_name: 'Old QB' },
  { season: 2023, week: 1, player_display_name: 'P. Mahomes' },
  { season: 2023, week: 2, player_display_name: 'P. Mahomes' },
  { season: 2024, week: 1, player_display_name: 'J. Allen' },
];

describe('loadNextgenStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(parquetResponse);
    mockParseParquet.mockResolvedValue(allSeasonsRecords);
  });

  describe('URL construction and stat type routing', () => {
    it('should fetch the passing parquet file by default', async () => {
      const result = await loadNextgenStats(2023);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/nextgen_stats\/ngs_passing\.parquet$/),
        expect.any(Object)
      );
    });

    it('should fetch the receiving file for statType receiving', async () => {
      await loadNextgenStats(2023, { statType: 'receiving' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/nextgen_stats\/ngs_receiving\.parquet$/),
        expect.any(Object)
      );
    });

    it('should fetch the rushing file for statType rushing', async () => {
      await loadNextgenStats(2023, { statType: 'rushing' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/nextgen_stats\/ngs_rushing\.parquet$/),
        expect.any(Object)
      );
    });

    it('should reject an invalid stat type without fetching', async () => {
      const result = await loadNextgenStats(2023, {
        statType: 'kicking' as unknown as 'passing',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('statType');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('season filtering', () => {
    it('should return all seasons when no seasons provided (default = all)', async () => {
      const result = await loadNextgenStats();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      if (result.ok) {
        expect(result.value).toHaveLength(4);
      }
    });

    it('should return all seasons when true provided', async () => {
      const result = await loadNextgenStats(true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(4);
      }
    });

    it('should filter to a single requested season', async () => {
      const result = await loadNextgenStats(2023);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value.every((record) => record.season === 2023)).toBe(true);
      }
    });

    it('should filter to an array of requested seasons', async () => {
      const result = await loadNextgenStats([2016, 2024]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should include week 0 season-aggregate rows in results', async () => {
      const result = await loadNextgenStats(2016);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.week).toBe(0);
      }
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2016 without fetching', async () => {
      const result = await loadNextgenStats(2015);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('2016');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for a future season', async () => {
      const result = await loadNextgenStats(2025);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error when data not found', async () => {
      mockGet.mockResolvedValue({ ...parquetResponse, status: 404, data: null });

      const result = await loadNextgenStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadNextgenStats(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
