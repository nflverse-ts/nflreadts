/**
 * Tests for ffopportunity expected points data loading
 * @module data/ff-opportunity.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadFfOpportunity } from '../../src/data/ff-opportunity.js';

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

// Mock parseParquet for parquet format tests
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: mockParseParquet,
  };
});

const weeklyCsv = [
  'season,posteam,week,player_id,full_name,position,total_fantasy_points_exp',
  '2023,KC,1,00-0033873,Patrick Mahomes,QB,22.4',
  '2023,KC,2,00-0033873,Patrick Mahomes,QB,19.1',
].join('\n');

const csvResponse = {
  data: weeklyCsv,
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
};

describe('loadFfOpportunity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(csvResponse);
  });

  describe('URL construction and routing', () => {
    it('should default to weekly stats, latest model, current season', async () => {
      const result = await loadFfOpportunity();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/github\.com\/ffverse\/ffopportunity\/releases\/download\/latest-data\/ep_weekly_2024\.csv$/
        ),
        expect.any(Object)
      );
    });

    it('should route statType pbp_pass into the file name', async () => {
      await loadFfOpportunity(2023, { statType: 'pbp_pass' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/latest-data\/ep_pbp_pass_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should route statType pbp_rush into the file name', async () => {
      await loadFfOpportunity(2023, { statType: 'pbp_rush' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/latest-data\/ep_pbp_rush_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should route modelVersion into the release tag', async () => {
      await loadFfOpportunity(2022, { modelVersion: 'v1.0.0' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/download\/v1\.0\.0-data\/ep_weekly_2022\.csv$/),
        expect.any(Object)
      );
    });

    it('should use parquet URLs when format is parquet', async () => {
      mockParseParquet.mockResolvedValue([{ season: 2023 }]);
      mockGet.mockResolvedValue({ ...csvResponse, data: new ArrayBuffer(100) });

      await loadFfOpportunity(2023, { format: 'parquet' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/ep_weekly_2023\.parquet$/),
        expect.any(Object)
      );
      expect(mockParseParquet).toHaveBeenCalledTimes(1);
    });
  });

  describe('season handling', () => {
    it('should fetch one file per season', async () => {
      const result = await loadFfOpportunity([2022, 2023]);

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/ep_weekly_2022\.csv$/),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(/ep_weekly_2023\.csv$/),
        expect.any(Object)
      );
    });

    it('should fetch all seasons since 2006 when true provided', async () => {
      const result = await loadFfOpportunity(true);

      expect(result.ok).toBe(true);
      // 2006 through mocked current season 2024
      expect(mockGet).toHaveBeenCalledTimes(19);
    });

    it('should combine records across seasons', async () => {
      const result = await loadFfOpportunity([2022, 2023]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(4);
        expect(result.value[0]?.full_name).toBe('Patrick Mahomes');
      }
    });
  });

  describe('error handling', () => {
    it('should return error for season before 2006 without fetching', async () => {
      const result = await loadFfOpportunity(2005);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('2006');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return error for a future season', async () => {
      const result = await loadFfOpportunity(2025);

      expect(result.ok).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should reject an invalid stat type without fetching', async () => {
      const result = await loadFfOpportunity(2023, {
        statType: 'monthly' as unknown as 'weekly',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('statType');
      }
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should reject an invalid model version without fetching', async () => {
      const result = await loadFfOpportunity(2023, {
        modelVersion: 'v2.0.0' as unknown as 'latest',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('modelVersion');
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

      const result = await loadFfOpportunity(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadFfOpportunity(2023);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
