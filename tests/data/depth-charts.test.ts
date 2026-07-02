/**
 * Tests for depth chart data loading
 * @module data/depth-charts.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDepthCharts } from '../../src/data/depth-charts.js';
import type { DepthChartDatedRecord, DepthChartWeeklyRecord } from '../../src/types/depth-chart.js';
import { ValidationError } from '../../src/types/error.js';

// Mock the HttpClient
const mockGet = vi.fn();
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
    getCurrentSeason: vi.fn(() => 2025),
  };
});

// Mock only parseParquet; parseCsv stays real
const mockParseParquet = vi.fn();
vi.mock('../../src/utils/parse.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/parse.js')>(
    '../../src/utils/parse.js'
  );
  return {
    ...actual,
    parseParquet: (...args: unknown[]) => mockParseParquet(...args) as Promise<unknown[]>,
  };
});

/** Date-level (2025+) fixture matching the ESPN-sourced schema */
const datedRecord: DepthChartDatedRecord = {
  dt: '2025-09-04T07:30:00Z',
  team: 'KC',
  player_name: 'Patrick Mahomes',
  espn_id: 3139477,
  gsis_id: '00-0033873',
  pos_grp_id: 15,
  pos_grp: '3WR 1TE',
  pos_id: 1,
  pos_name: 'Quarterback',
  pos_abb: 'QB',
  pos_slot: 1,
  pos_rank: 1,
};

/** Legacy weekly (2001-2024) CSV header */
const weeklyCsvHeader =
  'season,club_code,week,game_type,depth_team,last_name,first_name,football_name,formation,gsis_id,jersey_number,position,elias_id,depth_position,full_name';

const weeklyCsvRow = (season: number, lastName = 'Mahomes', firstName = 'Patrick'): string =>
  `${season},KC,1,REG,1,${lastName},${firstName},${firstName},Offense,00-0033873,15,QB,MAH473748,QB,${firstName} ${lastName}`;

const csvResponse = (data: string) => ({
  data,
  status: 200,
  headers: { 'content-type': 'text/csv' },
  fromCache: false,
  url: 'test-url',
});

const parquetResponse = () => ({
  data: new ArrayBuffer(8),
  status: 200,
  headers: { 'content-type': 'application/octet-stream' },
  fromCache: false,
  url: 'test-url',
});

describe('loadDepthCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockResolvedValue([datedRecord]);
  });

  describe('season normalization', () => {
    it('should load current season as parquet when no arguments provided', async () => {
      mockGet.mockResolvedValue(parquetResponse());

      const result = await loadDepthCharts();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0] as DepthChartDatedRecord;
      expect(entry.player_name).toBe('Patrick Mahomes');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2025.parquet'),
        expect.any(Object)
      );
    });

    it('should load specific season', async () => {
      mockGet.mockResolvedValue(
        csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2023, 'Allen', 'Josh')}`)
      );

      const result = await loadDepthCharts(2023, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0] as DepthChartWeeklyRecord;
      expect(entry.full_name).toBe('Josh Allen');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2022)}`))
        .mockResolvedValueOnce(
          csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2023, 'Allen', 'Josh')}`)
        );

      const result = await loadDepthCharts([2022, 2023], { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2022.csv'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2023.csv'),
        expect.any(Object)
      );
    });

    it('should load all seasons when true is passed', async () => {
      mockGet.mockResolvedValue(parquetResponse());

      const _result = await loadDepthCharts(true);

      // Should call for many seasons (2001-2025)
      expect(mockGet.mock.calls.length).toBeGreaterThan(20);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2001.parquet'),
        expect.any(Object)
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('depth_charts_2025.parquet'),
        expect.any(Object)
      );
    });
  });

  describe('validation', () => {
    it('should reject seasons before 2001', async () => {
      const result = await loadDepthCharts(2000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('before the minimum season');
    });

    it('should reject future seasons', async () => {
      const result = await loadDepthCharts(2026);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('in the future');
    });

    it('should reject invalid season in array', async () => {
      const result = await loadDepthCharts([2023, 2026]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should accept 2001 (minimum valid season)', async () => {
      mockGet.mockResolvedValue(
        csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2001, 'Brady', 'Tom')}`)
      );

      const result = await loadDepthCharts(2001, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0] as DepthChartWeeklyRecord;
      expect(entry.season).toBe(2001);
      expect(entry.full_name).toBe('Tom Brady');
    });

    it('should accept current season (maximum valid season)', async () => {
      mockGet.mockResolvedValue(parquetResponse());

      const result = await loadDepthCharts(2025);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0] as DepthChartDatedRecord;
      expect(entry.dt).toBe('2025-09-04T07:30:00Z');
    });
  });

  describe('format options', () => {
    it('should use Parquet format by default', async () => {
      mockGet.mockResolvedValue(parquetResponse());

      await loadDepthCharts(2025);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
      expect(mockParseParquet).toHaveBeenCalledTimes(1);
    });

    it('should use CSV format when specified', async () => {
      mockGet.mockResolvedValue(csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2023)}`));

      await loadDepthCharts(2023, { format: 'csv' });

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
      expect(mockParseParquet).not.toHaveBeenCalled();
    });
  });

  describe('data structure', () => {
    it('should return date-level records for 2025+ seasons', async () => {
      const mockCsvData = `dt,team,player_name,espn_id,gsis_id,pos_grp_id,pos_grp,pos_id,pos_name,pos_abb,pos_slot,pos_rank
2025-09-04T07:30:00Z,KC,Patrick Mahomes,3139477,00-0033873,15,3WR 1TE,1,Quarterback,QB,1,1`;

      mockGet.mockResolvedValue(csvResponse(mockCsvData));

      const result = await loadDepthCharts(2025, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);

      const entry = result.value[0] as DepthChartDatedRecord;
      // dt is parsed as Date object by CSV parser with dynamicTyping
      expect(entry.dt).toBeInstanceOf(Date);
      expect((entry.dt as unknown as Date).toISOString()).toBe('2025-09-04T07:30:00.000Z');
      expect(entry.team).toBe('KC');
      expect(entry.player_name).toBe('Patrick Mahomes');
      expect(entry.espn_id).toBe(3139477);
      expect(entry.gsis_id).toBe('00-0033873');
      expect(entry.pos_grp).toBe('3WR 1TE');
      expect(entry.pos_abb).toBe('QB');
      expect(entry.pos_rank).toBe(1);
    });

    it('should return weekly records for legacy seasons', async () => {
      mockGet.mockResolvedValue(csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2023)}`));

      const result = await loadDepthCharts(2023, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);

      const entry = result.value[0] as DepthChartWeeklyRecord;
      expect(entry.season).toBe(2023);
      expect(entry.club_code).toBe('KC');
      expect(entry.week).toBe(1);
      expect(entry.game_type).toBe('REG');
      expect(entry.depth_team).toBe(1);
      expect(entry.gsis_id).toBe('00-0033873');
      expect(entry.position).toBe('QB');
      expect(entry.depth_position).toBe('QB');
      expect(entry.full_name).toBe('Patrick Mahomes');
    });

    it('should handle multiple players at different ranks', async () => {
      const mockCsvData = `dt,team,player_name,pos_abb,pos_rank
2025-09-04T07:30:00Z,KC,Patrick Mahomes,QB,1
2025-09-04T07:30:00Z,KC,Travis Kelce,TE,1
2025-09-04T07:30:00Z,KC,Gardner Minshew,QB,2`;

      mockGet.mockResolvedValue(csvResponse(mockCsvData));

      const result = await loadDepthCharts(2025, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      const entries = result.value as DepthChartDatedRecord[];
      expect(entries[0]!.player_name).toBe('Patrick Mahomes');
      expect(entries[1]!.player_name).toBe('Travis Kelce');
      expect(entries[2]!.player_name).toBe('Gardner Minshew');
    });

    it('should handle null values correctly', async () => {
      const mockCsvData = `dt,team,player_name,espn_id,gsis_id
2025-09-04T07:30:00Z,KC,Patrick Mahomes,,`;

      mockGet.mockResolvedValue(csvResponse(mockCsvData));

      const result = await loadDepthCharts(2025, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const entry = result.value[0] as DepthChartDatedRecord;
      expect(entry.espn_id).toBeNull();
      expect(entry.gsis_id).toBeNull();
    });
  });

  describe('parallel fetching', () => {
    it('should fetch multiple seasons in parallel', async () => {
      mockGet.mockResolvedValue(csvResponse(`${weeklyCsvHeader}\n${weeklyCsvRow(2023)}`));

      const startTime = Date.now();
      await loadDepthCharts([2021, 2022, 2023], { format: 'csv' });
      const endTime = Date.now();

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('data concatenation', () => {
    it('should correctly concatenate multiple seasons', async () => {
      mockGet
        .mockResolvedValueOnce(
          csvResponse(
            `${weeklyCsvHeader}\n${weeklyCsvRow(2022)}\n${weeklyCsvRow(2022, 'Allen', 'Josh')}`
          )
        )
        .mockResolvedValueOnce(
          csvResponse(
            `${weeklyCsvHeader}\n${weeklyCsvRow(2023)}\n${weeklyCsvRow(2023, 'Allen', 'Josh')}\n${weeklyCsvRow(2023, 'Purdy', 'Brock')}`
          )
        );

      const result = await loadDepthCharts([2022, 2023], { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(5);

      const entries = result.value as DepthChartWeeklyRecord[];
      expect(entries.filter((r) => r.season === 2022)).toHaveLength(2);
      expect(entries.filter((r) => r.season === 2023)).toHaveLength(3);
    });

    it('should handle empty datasets', async () => {
      mockGet.mockResolvedValue(csvResponse(`${weeklyCsvHeader}\n`));

      const result = await loadDepthCharts(2023, { format: 'csv' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(0);
    });
  });

  describe('options', () => {
    it('should pass signal for cancellation', async () => {
      mockGet.mockResolvedValue(parquetResponse());

      const controller = new AbortController();
      await loadDepthCharts(2025, { signal: controller.signal });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });
});
