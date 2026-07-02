/**
 * Tests for contract data loading
 * @module data/contracts.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadContracts } from '../../src/data/contracts.js';
import { DataNotFoundError } from '../../src/types/error.js';

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

describe('loadContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
  });

  const mockContracts = [
    {
      player: 'Joe Burrow',
      position: 'QB',
      team: 'Bengals',
      is_active: true,
      year_signed: 2023,
      years: 5,
      value: 275,
      apy: 55,
      guaranteed: 146.51,
      apy_cap_pct: 0.245,
      otc_id: 8741,
      gsis_id: '00-0036442',
      cols: [
        {
          year: '2023',
          team: 'Bengals',
          base_salary: 1.01,
          cap_number: 19.515043,
          cap_percent: 0.086,
        },
      ],
    },
    {
      player: 'Justin Jefferson',
      position: 'WR',
      team: 'Vikings',
      is_active: true,
      year_signed: 2024,
      years: 4,
      value: 140,
      apy: 35,
      guaranteed: 88.743,
      apy_cap_pct: 0.137,
      otc_id: 9999,
      gsis_id: '00-0036322',
      cols: null,
    },
  ];

  const parquetResponse = {
    data: new ArrayBuffer(100),
    status: 200,
    headers: { 'content-type': 'application/octet-stream' },
    fromCache: false,
    url: 'test-url',
  };

  describe('default behavior', () => {
    it('should load the full contracts file with no seasons parameter', async () => {
      mockGet.mockResolvedValue(parquetResponse);
      mockParseParquet.mockResolvedValue(mockContracts);

      const result = await loadContracts();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should default to parquet format (nflverse publishes no plain csv)', async () => {
      mockGet.mockResolvedValue(parquetResponse);
      mockParseParquet.mockResolvedValue(mockContracts);

      const result = await loadContracts();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
      expect(mockParseParquet).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL building', () => {
    it('should fetch from the real contracts release URL', async () => {
      mockGet.mockResolvedValue(parquetResponse);
      mockParseParquet.mockResolvedValue(mockContracts);

      await loadContracts();

      expect(mockGet).toHaveBeenCalledWith(
        'https://github.com/nflverse/nflverse-data/releases/download/contracts/historical_contracts.parquet',
        expect.any(Object)
      );
    });
  });

  describe('format options', () => {
    it('should load CSV format when explicitly requested', async () => {
      const csvResponse = {
        data: [
          'player,position,team,is_active,year_signed,years,value,apy',
          'Joe Burrow,QB,Bengals,TRUE,2023,5,275,55',
        ].join('\n'),
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(csvResponse);

      const result = await loadContracts({ format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.player).toBe('Joe Burrow');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('historical_contracts.csv'),
        expect.any(Object)
      );
    });
  });

  describe('data structure', () => {
    it('should return contract records with nested per-season detail', async () => {
      mockGet.mockResolvedValue(parquetResponse);
      mockParseParquet.mockResolvedValue(mockContracts);

      const result = await loadContracts();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const contract = result.value[0]!;
      expect(contract.player).toBe('Joe Burrow');
      expect(contract.position).toBe('QB');
      expect(contract.is_active).toBe(true);
      expect(contract.year_signed).toBe(2023);
      expect(contract.value).toBe(275);
      expect(contract.apy).toBe(55);
      expect(contract.cols).toHaveLength(1);
      expect(contract.cols?.[0]?.cap_number).toBe(19.515043);
      expect(result.value[1]?.cols).toBeNull();
    });
  });

  describe('options', () => {
    it('should pass signal to HttpClient for request cancellation', async () => {
      mockGet.mockResolvedValue(parquetResponse);
      mockParseParquet.mockResolvedValue(mockContracts);

      const controller = new AbortController();
      const result = await loadContracts({ signal: controller.signal });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadContracts();

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

      const result = await loadContracts({ format: 'csv' });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(DataNotFoundError);
      expect(result.error.message).toContain('Data not found');
    });
  });
});
