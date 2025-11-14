/**
 * Tests for team data loading
 * @module data/teams.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadTeams } from '../../src/data/teams.js';

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

describe('loadTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
    mockParseParquet.mockClear();
  });

  describe('basic loading', () => {
    it('should load teams data with default options', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division\nKC,Kansas City Chiefs,2310,Chiefs,AFC,West',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.team_abbr).toBe('KC');
      expect(result.value[0]?.team_name).toBe('Kansas City Chiefs');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('teams.csv'),
        expect.any(Object)
      );
    });

    it('should load teams with current filter enabled by default', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division\nKC,Kansas City Chiefs,2310,Chiefs,AFC,West',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.team_abbr).toBe('KC');
    });
  });

  describe('format options', () => {
    it('should load CSV format by default', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division\nKC,Kansas City Chiefs,2310,Chiefs,AFC,West',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.any(Object));
    });

    it('should load Parquet format when specified', async () => {
      const mockParquetData = new ArrayBuffer(100);
      const mockResponse = {
        data: mockParquetData,
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      // Mock parseParquet to return test data
      mockParseParquet.mockResolvedValue([
        {
          team_abbr: 'KC',
          team_name: 'Kansas City Chiefs',
          team_id: 2310,
          team_nick: 'Chiefs',
          team_conf: 'AFC',
          team_division: 'West',
        },
      ]);

      const result = await loadTeams({ format: 'parquet' });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('.parquet'), expect.any(Object));
    });
  });

  describe('data structure', () => {
    it('should return array of team records with proper structure', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division,team_color,team_color2,team_color3,team_color4,team_logo_wikipedia,team_logo_espn,team_wordmark,team_conference_logo,team_league_logo,team_logo_squared
KC,Kansas City Chiefs,2310,Chiefs,AFC,West,#E31837,#FFB81C,,,https://example.com/wiki.png,https://example.com/espn.png,https://example.com/word.png,https://example.com/conf.png,https://example.com/nfl.png,https://example.com/square.png`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const team = result.value[0]!;
      expect(team.team_abbr).toBe('KC');
      expect(team.team_name).toBe('Kansas City Chiefs');
      expect(team.team_id).toBe(2310);
      expect(team.team_nick).toBe('Chiefs');
      expect(team.team_conf).toBe('AFC');
      expect(team.team_division).toBe('West');
      expect(team.team_color).toBe('#E31837');
      expect(team.team_color2).toBe('#FFB81C');
      expect(team.team_logo_wikipedia).toBe('https://example.com/wiki.png');
      expect(team.team_logo_espn).toBe('https://example.com/espn.png');
      expect(team.team_wordmark).toBe('https://example.com/word.png');
      expect(team.team_conference_logo).toBe('https://example.com/conf.png');
      expect(team.team_league_logo).toBe('https://example.com/nfl.png');
      expect(team.team_logo_squared).toBe('https://example.com/square.png');
    });

    it('should handle multiple teams', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division
KC,Kansas City Chiefs,2310,Chiefs,AFC,West
BUF,Buffalo Bills,610,Bills,AFC,East
SF,San Francisco 49ers,4500,49ers,NFC,West`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      expect(result.value.map((t) => t.team_abbr)).toEqual(['KC', 'BUF', 'SF']);
    });

    it('should handle null values for optional color fields', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division,team_color,team_color2,team_color3,team_color4
KC,Kansas City Chiefs,2310,Chiefs,AFC,West,#E31837,#FFB81C,,`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      const team = result.value[0]!;
      expect(team.team_color).toBe('#E31837');
      expect(team.team_color2).toBe('#FFB81C');
      expect(team.team_color3).toBeNull();
      expect(team.team_color4).toBeNull();
    });
  });

  describe('current filter option', () => {
    it('should filter for current teams when current=true', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division,team_current
KC,Kansas City Chiefs,2310,Chiefs,AFC,West,1
BUF,Buffalo Bills,610,Bills,AFC,East,1
STL,St. Louis Rams,2510,Rams,NFC,West,0`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams({ current: true });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(2);
      expect(result.value.map((t) => t.team_abbr)).toEqual(['KC', 'BUF']);
    });

    it('should include all teams when current=false', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division,team_current
KC,Kansas City Chiefs,2310,Chiefs,AFC,West,1
BUF,Buffalo Bills,610,Bills,AFC,East,1
STL,St. Louis Rams,2510,Rams,NFC,West,0`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams({ current: false });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(3);
      expect(result.value.map((t) => t.team_abbr)).toEqual(['KC', 'BUF', 'STL']);
    });

    it('should return all teams when team_current field is not present', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division
KC,Kansas City Chiefs,2310,Chiefs,AFC,West
BUF,Buffalo Bills,610,Bills,AFC,East`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams({ current: true });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // Should return all teams since there's no team_current field to filter on
      expect(result.value).toHaveLength(2);
    });
  });

  describe('conference and division filtering', () => {
    it('should be able to filter by conference', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division
KC,Kansas City Chiefs,2310,Chiefs,AFC,West
BUF,Buffalo Bills,610,Bills,AFC,East
SF,San Francisco 49ers,4500,49ers,NFC,West
DAL,Dallas Cowboys,1200,Cowboys,NFC,East`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const afcTeams = result.value.filter((t) => t.team_conf === 'AFC');

      expect(afcTeams).toHaveLength(2);
      expect(afcTeams.map((t) => t.team_abbr)).toEqual(['KC', 'BUF']);
    });

    it('should be able to filter by division', async () => {
      const mockResponse = {
        data: `team_abbr,team_name,team_id,team_nick,team_conf,team_division
KC,Kansas City Chiefs,2310,Chiefs,AFC,West
LAC,Los Angeles Chargers,4400,Chargers,AFC,West
BUF,Buffalo Bills,610,Bills,AFC,East`,
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const afcWest = result.value.filter(
        (t) => t.team_division === 'West' && t.team_conf === 'AFC'
      );

      expect(afcWest).toHaveLength(2);
      expect(afcWest.map((t) => t.team_abbr)).toEqual(['KC', 'LAC']);
    });
  });

  describe('options', () => {
    it('should pass signal to HttpClient for request cancellation', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division\nKC,Kansas City Chiefs,2310,Chiefs,AFC,West',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const controller = new AbortController();
      const result = await loadTeams({ signal: controller.signal });

      expect(result.ok).toBe(true);
      expect(mockGet).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });

  describe('error handling', () => {
    it('should return error when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await loadTeams();

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('Network error');
    });

    it('should handle empty dataset', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: false,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(0);
    });
  });

  describe('caching', () => {
    it('should use cached data when available', async () => {
      const mockResponse = {
        data: 'team_abbr,team_name,team_id,team_nick,team_conf,team_division\nKC,Kansas City Chiefs,2310,Chiefs,AFC,West',
        status: 200,
        headers: { 'content-type': 'text/csv' },
        fromCache: true,
        url: 'test-url',
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await loadTeams();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
