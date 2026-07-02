/**
 * Tests for fantasy football player IDs data loading
 * @module data/ff-playerids.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadFfPlayerids } from '../../src/data/ff-playerids.js';

// Use vi.hoisted to declare mocks that will be used in vi.mock
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

// Mock the HttpClient
vi.mock('../../src/client/client.js', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

const playeridsCsv = [
  'mfl_id,gsis_id,sleeper_id,name,merge_name,position,team',
  '13116,00-0033873,4046,Patrick Mahomes,patrick mahomes,QB,KCC',
  '13113,00-0034857,4984,Josh Allen,josh allen,QB,BUF',
].join('\n');

const csvResponse = {
  data: playeridsCsv,
  status: 200,
  headers: {},
  fromCache: false,
  url: 'test-url',
};

describe('loadFfPlayerids', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(csvResponse);
  });

  describe('URL construction', () => {
    it('should fetch the DynastyProcess db_playerids CSV', async () => {
      await loadFfPlayerids();

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/github\.com\/dynastyprocess\/data\/raw\/master\/files\/db_playerids\.csv$/
        ),
        expect.any(Object)
      );
    });

    it('should fetch exactly once (single file, no seasons)', async () => {
      await loadFfPlayerids();

      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('data parsing', () => {
    it('should return parsed player ID records', async () => {
      const result = await loadFfPlayerids();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.name).toBe('Patrick Mahomes');
        expect(result.value[0]?.gsis_id).toBe('00-0033873');
      }
    });

    it('should preserve numeric platform IDs', async () => {
      const result = await loadFfPlayerids();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.mfl_id).toBe(13116);
        expect(result.value[0]?.sleeper_id).toBe(4046);
      }
    });

    it('should map cross-platform IDs on the same row', async () => {
      const result = await loadFfPlayerids();

      expect(result.ok).toBe(true);
      if (result.ok) {
        const mahomes = result.value.find((row) => row.gsis_id === '00-0033873');
        expect(mahomes?.sleeper_id).toBe(4046);
        expect(mahomes?.position).toBe('QB');
      }
    });
  });

  describe('error handling', () => {
    it('should return error when data not found', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 404,
        headers: {},
        fromCache: false,
        url: 'test-url',
      });

      const result = await loadFfPlayerids();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should return error on network failure', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadFfPlayerids();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error on unexpected rejection value', async () => {
      mockGet.mockRejectedValue('boom');

      const result = await loadFfPlayerids();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
