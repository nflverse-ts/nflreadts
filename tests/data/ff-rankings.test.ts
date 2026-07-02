/**
 * Tests for fantasy football rankings data loading
 * @module data/ff-rankings.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadFfRankings } from '../../src/data/ff-rankings.js';

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

// Mock parseParquet (the 'all' dataset is parquet-only)
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

const rankingsCsv = [
  'player,pos,team,ecr,sd,best,worst,scrape_date',
  'Justin Jefferson,WR,MIN,1,0.5,1,2,2024-08-01',
  'Christian McCaffrey,RB,SF,2,0.8,1,3,2024-08-01',
].join('\n');

const csvResponse = {
  data: rankingsCsv,
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
};

describe('loadFfRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(csvResponse);
  });

  describe('type routing and URL construction', () => {
    it('should fetch the latest draft rankings CSV by default', async () => {
      const result = await loadFfRankings();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/github\.com\/dynastyprocess\/data\/raw\/master\/files\/db_fpecr_latest\.csv$/
        ),
        expect.any(Object)
      );
    });

    it('should fetch the draft rankings CSV for explicit type draft', async () => {
      await loadFfRankings('draft');

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/db_fpecr_latest\.csv$/),
        expect.any(Object)
      );
    });

    it('should fetch the weekly rankings CSV for type week', async () => {
      await loadFfRankings('week');

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/files\/fp_latest_weekly\.csv$/),
        expect.any(Object)
      );
    });

    it('should fetch the historical parquet file for type all', async () => {
      mockParseParquet.mockResolvedValue([{ player: 'Justin Jefferson', ecr: 1 }]);
      mockGet.mockResolvedValue({ ...csvResponse, data: new ArrayBuffer(100) });

      const result = await loadFfRankings('all');

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/files\/db_fpecr\.parquet$/),
        expect.any(Object)
      );
      expect(mockParseParquet).toHaveBeenCalledTimes(1);
    });
  });

  describe('data parsing', () => {
    it('should return parsed CSV rankings records', async () => {
      const result = await loadFfRankings('draft');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.pos).toBe('WR');
        expect(result.value[0]?.ecr).toBe(1);
      }
    });

    it('should return parquet-parsed records for type all', async () => {
      mockParseParquet.mockResolvedValue([
        { player: 'Justin Jefferson', ecr: 1 },
        { player: "Ja'Marr Chase", ecr: 2 },
      ]);
      mockGet.mockResolvedValue({ ...csvResponse, data: new ArrayBuffer(100) });

      const result = await loadFfRankings('all');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('error handling', () => {
    it('should reject an invalid type without fetching', async () => {
      const result = await loadFfRankings('season' as unknown as 'draft');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('type');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error when data not found', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadFfRankings('week');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadFfRankings();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
