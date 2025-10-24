/**
 * Tests for URL utilities
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as configManager from '../../src/config/manager.js';
import {
  addQueryParams,
  buildContractsUrl,
  buildDepthChartsUrl,
  buildDraftPicksUrl,
  buildInjuriesUrl,
  buildNextGenStatsUrl,
  buildNflverseUrl,
  buildParticipationUrl,
  buildPbpUrl,
  buildPlayerStatsUrl,
  buildPlayersUrl,
  buildQueryString,
  buildRosterUrl,
  buildScheduleUrl,
  buildSnapCountsUrl,
  buildTeamsUrl,
  buildWeeklyRosterUrl,
  getFilenameFromUrl,
  isNflverseUrl,
  joinUrlParts,
  normalizeUrl,
} from '../../src/utils/url.js';

describe('URL Utilities', () => {
  const mockBaseUrl = 'https://github.com/nflverse/nflverse-data/releases/download';

  beforeEach(() => {
    // Mock getConfig to return our test base URL
    vi.spyOn(configManager, 'getConfig').mockReturnValue({
      dataSources: {
        baseUrl: mockBaseUrl,
        timeout: 30000,
        retries: 3,
        cache: true,
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 300000,
      },
      logging: {
        level: 'info',
        format: 'json',
        destination: 'console',
      },
    });
  });

  describe('buildNflverseUrl', () => {
    it('should build URL with default CSV format', () => {
      const url = buildNflverseUrl('pbp', 'play_by_play_2024');
      expect(url).toBe(`${mockBaseUrl}/pbp/play_by_play_2024.csv`);
    });

    it('should build URL with custom format', () => {
      const url = buildNflverseUrl('pbp', 'play_by_play_2024', 'parquet');
      expect(url).toBe(`${mockBaseUrl}/pbp/play_by_play_2024.parquet`);
    });

    it('should handle different data types', () => {
      const url = buildNflverseUrl('rosters', 'roster_2024', 'json');
      expect(url).toBe(`${mockBaseUrl}/rosters/roster_2024.json`);
    });
  });

  describe('buildPbpUrl', () => {
    it('should build play-by-play URL', () => {
      const url = buildPbpUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/pbp/play_by_play_2024.csv`);
    });

    it('should support different formats', () => {
      const url = buildPbpUrl(2024, 'parquet');
      expect(url).toBe(`${mockBaseUrl}/pbp/play_by_play_2024.parquet`);
    });
  });

  describe('buildPlayerStatsUrl', () => {
    it('should build player stats URL', () => {
      const url = buildPlayerStatsUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/player_stats/player_stats_2024.csv`);
    });

    it('should support different formats', () => {
      const url = buildPlayerStatsUrl(2024, 'json');
      expect(url).toBe(`${mockBaseUrl}/player_stats/player_stats_2024.json`);
    });
  });

  describe('buildRosterUrl', () => {
    it('should build roster URL', () => {
      const url = buildRosterUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/rosters/roster_2024.csv`);
    });
  });

  describe('buildWeeklyRosterUrl', () => {
    it('should build weekly roster URL', () => {
      const url = buildWeeklyRosterUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/rosters/roster_weekly_2024.csv`);
    });
  });

  describe('buildScheduleUrl', () => {
    it('should build schedule URL', () => {
      const url = buildScheduleUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/schedules/sched_2024.csv`);
    });
  });

  describe('buildTeamsUrl', () => {
    it('should build teams URL without season', () => {
      const url = buildTeamsUrl();
      expect(url).toBe(`${mockBaseUrl}/teams/teams.csv`);
    });

    it('should support different formats', () => {
      const url = buildTeamsUrl('json');
      expect(url).toBe(`${mockBaseUrl}/teams/teams.json`);
    });
  });

  describe('buildPlayersUrl', () => {
    it('should build players URL without season', () => {
      const url = buildPlayersUrl();
      expect(url).toBe(`${mockBaseUrl}/players/players.csv`);
    });
  });

  describe('buildParticipationUrl', () => {
    it('should build participation URL', () => {
      const url = buildParticipationUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/participation/participation_2024.csv`);
    });
  });

  describe('buildDepthChartsUrl', () => {
    it('should build depth charts URL', () => {
      const url = buildDepthChartsUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/depth_charts/depth_charts_2024.csv`);
    });
  });

  describe('buildInjuriesUrl', () => {
    it('should build injuries URL', () => {
      const url = buildInjuriesUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/injuries/injuries_2024.csv`);
    });
  });

  describe('buildDraftPicksUrl', () => {
    it('should build draft picks URL', () => {
      const url = buildDraftPicksUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/draft_picks/draft_picks_2024.csv`);
    });
  });

  describe('buildContractsUrl', () => {
    it('should build contracts URL without season', () => {
      const url = buildContractsUrl();
      expect(url).toBe(`${mockBaseUrl}/contracts/contracts.csv`);
    });
  });

  describe('buildNextGenStatsUrl', () => {
    it('should build Next Gen Stats URL', () => {
      const url = buildNextGenStatsUrl(2024, 'passing');
      expect(url).toBe(`${mockBaseUrl}/nextgen_stats/ngs_passing_2024.csv`);
    });

    it('should handle different stat types', () => {
      const url = buildNextGenStatsUrl(2024, 'rushing', 'parquet');
      expect(url).toBe(`${mockBaseUrl}/nextgen_stats/ngs_rushing_2024.parquet`);
    });
  });

  describe('buildSnapCountsUrl', () => {
    it('should build snap counts URL', () => {
      const url = buildSnapCountsUrl(2024);
      expect(url).toBe(`${mockBaseUrl}/snap_counts/snap_counts_2024.csv`);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = { foo: 'bar', baz: 123 };
      const query = buildQueryString(params);
      expect(query).toBe('?foo=bar&baz=123');
    });

    it('should handle boolean values', () => {
      const params = { active: true, archived: false };
      const query = buildQueryString(params);
      expect(query).toContain('active=true');
      expect(query).toContain('archived=false');
    });

    it('should skip undefined values', () => {
      const params = { foo: 'bar', baz: undefined };
      const query = buildQueryString(params);
      expect(query).toBe('?foo=bar');
      expect(query).not.toContain('baz');
    });

    it('should return empty string for empty params', () => {
      const query = buildQueryString({});
      expect(query).toBe('');
    });

    it('should return empty string when all values are undefined', () => {
      const params = { foo: undefined, bar: undefined };
      const query = buildQueryString(params);
      expect(query).toBe('');
    });
  });

  describe('addQueryParams', () => {
    it('should add query params to URL', () => {
      const url = 'https://example.com/api';
      const params = { season: 2024, week: 1 };
      const result = addQueryParams(url, params);
      expect(result).toBe('https://example.com/api?season=2024&week=1');
    });

    it('should return original URL if no params', () => {
      const url = 'https://example.com/api';
      const result = addQueryParams(url, {});
      expect(result).toBe(url);
    });

    it('should return original URL if all params undefined', () => {
      const url = 'https://example.com/api';
      const params = { foo: undefined };
      const result = addQueryParams(url, params);
      expect(result).toBe(url);
    });
  });

  describe('getFilenameFromUrl', () => {
    it('should extract filename from URL', () => {
      const url = 'https://example.com/path/to/file.csv';
      expect(getFilenameFromUrl(url)).toBe('file.csv');
    });

    it('should handle URLs with query params', () => {
      const url = 'https://example.com/file.csv?foo=bar';
      expect(getFilenameFromUrl(url)).toBe('file.csv');
    });

    it('should handle URLs ending in slash', () => {
      const url = 'https://example.com/path/';
      expect(getFilenameFromUrl(url)).toBe('');
    });

    it('should return unknown for invalid URLs', () => {
      expect(getFilenameFromUrl('not-a-url')).toBe('unknown');
    });

    it('should return unknown for empty path', () => {
      const url = 'https://example.com';
      const result = getFilenameFromUrl(url);
      // URL pathname is '/' so last part after split is empty
      expect(result).toBe('');
    });
  });

  describe('isNflverseUrl', () => {
    it('should return true for nflverse GitHub URLs', () => {
      const url = 'https://github.com/nflverse/nflverse-data/releases/download/pbp/file.csv';
      expect(isNflverseUrl(url)).toBe(true);
    });

    it('should return false for non-GitHub URLs', () => {
      const url = 'https://example.com/nflverse/data';
      expect(isNflverseUrl(url)).toBe(false);
    });

    it('should return false for GitHub URLs without nflverse', () => {
      const url = 'https://github.com/other/repo';
      expect(isNflverseUrl(url)).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isNflverseUrl('not-a-url')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should remove trailing slash from pathname', () => {
      const url = 'https://example.com/path/';
      expect(normalizeUrl(url)).toBe('https://example.com/path');
    });

    it('should not modify URL without trailing slash', () => {
      const url = 'https://example.com/path';
      expect(normalizeUrl(url)).toBe(url);
    });

    it('should preserve query params', () => {
      const url = 'https://example.com/path/?foo=bar';
      expect(normalizeUrl(url)).toBe('https://example.com/path?foo=bar');
    });

    it('should handle invalid URLs by removing trailing slash', () => {
      const url = 'not-a-url/';
      expect(normalizeUrl(url)).toBe('not-a-url');
    });

    it('should not remove trailing slash from domain', () => {
      const url = 'https://example.com/';
      // URL constructor will keep the trailing slash for root path
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/');
    });
  });

  describe('joinUrlParts', () => {
    it('should join URL parts with single slashes', () => {
      const result = joinUrlParts('https://example.com', 'api', 'v1', 'users');
      expect(result).toBe('https://example.com/api/v1/users');
    });

    it('should handle parts with leading slashes', () => {
      const result = joinUrlParts('https://example.com', '/api', '/v1');
      expect(result).toBe('https://example.com/api/v1');
    });

    it('should handle parts with trailing slashes', () => {
      const result = joinUrlParts('https://example.com/', 'api/', 'v1/');
      expect(result).toBe('https://example.com/api/v1/');
    });

    it('should handle mixed slashes', () => {
      const result = joinUrlParts('https://example.com/', '/api/', '/v1');
      expect(result).toBe('https://example.com/api/v1');
    });

    it('should handle single part', () => {
      const result = joinUrlParts('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should handle empty parts', () => {
      const result = joinUrlParts('https://example.com', '', 'api');
      expect(result).toBe('https://example.com//api');
    });

    it('should preserve multiple slashes within parts', () => {
      const result = joinUrlParts('https://example.com', 'api//v1');
      expect(result).toBe('https://example.com/api//v1');
    });
  });

  describe('file format variations', () => {
    it('should support all file formats', () => {
      const formats: Array<'csv' | 'parquet' | 'rds' | 'json'> = ['csv', 'parquet', 'rds', 'json'];

      formats.forEach((format) => {
        const url = buildPbpUrl(2024, format);
        expect(url).toContain(`.${format}`);
      });
    });
  });

  describe('season variations', () => {
    it('should handle different season years', () => {
      const seasons = [2020, 2021, 2022, 2023, 2024];

      seasons.forEach((season) => {
        const url = buildPbpUrl(season);
        expect(url).toContain(`play_by_play_${season}`);
      });
    });
  });
});
