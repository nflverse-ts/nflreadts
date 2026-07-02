import type { SeasonType } from './common';

/**
 *  Farthest season back for which player participation data exists
 */
export const MIN_PARTICIPATION_SEASON = 2016;

/**
 * Historical team abbreviations (relocated/renamed teams)
 */
export const HISTORICAL_TEAMS = [
  'SD', // San Diego Chargers (now LAC)
  'STL', // St. Louis Rams (now LA)
  'OAK', // Oakland Raiders (now LV)
] as const;

/**
 * Valid NFL team abbreviations
 * Standard abbreviations used across nflverse
 */
export const NFL_TEAMS = [
  // AFC East
  'BUF',
  'MIA',
  'NE',
  'NYJ',
  // AFC North
  'BAL',
  'CIN',
  'CLE',
  'PIT',
  // AFC South
  'HOU',
  'IND',
  'JAX',
  'TEN',
  // AFC West
  'DEN',
  'KC',
  'LV',
  'LAC',
  // NFC East
  'DAL',
  'NYG',
  'PHI',
  'WAS',
  // NFC North
  'CHI',
  'DET',
  'GB',
  'MIN',
  // NFC South
  'ATL',
  'CAR',
  'NO',
  'TB',
  // NFC West
  'ARI',
  'LA',
  'SF',
  'SEA',
] as const;

/**
 * Minimum valid NFL season (modern era)
 */
export const MIN_SEASON = 1999;

/**
 * Maximum regular season week
 */
export const MAX_REGULAR_SEASON_WEEK = 18;

/**
 * Maximum playoff week
 */
export const MAX_PLAYOFF_WEEK = 22;

/**
 * Valid season types
 */
export const SEASON_TYPES: readonly SeasonType[] = ['REG', 'POST', 'PRE'] as const;

/**
 * Minimum season with depth chart data available
 */
export const MIN_DEPTH_CHART_SEASON = 2001;

/**
 * Minimum season with week-level roster data available
 */
export const MIN_WEEKLY_ROSTER_SEASON = 2002;

/**
 * Minimum season with injury report data available
 */
export const MIN_INJURY_SEASON = 2009;

/**
 * Minimum season with snap count data available (PFR)
 */
export const MIN_SNAP_COUNT_SEASON = 2012;

/**
 * Minimum season with FTN charting data available
 */
export const MIN_FTN_SEASON = 2022;

/**
 * Minimum season with Next Gen Stats data available
 */
export const MIN_NEXTGEN_SEASON = 2016;

/**
 * Minimum season with PFR advanced stats available
 */
export const MIN_PFR_ADVSTATS_SEASON = 2018;

/**
 * Minimum season with officials data available
 */
export const MIN_OFFICIALS_SEASON = 2015;

/**
 * Minimum season with trade data available
 */
export const MIN_TRADES_SEASON = 2002;

/**
 * Minimum season with draft pick data available (PFR)
 */
export const MIN_DRAFT_PICKS_SEASON = 1980;

/**
 * Minimum season with combine data available (PFR)
 */
export const MIN_COMBINE_SEASON = 2000;

/**
 * Minimum season with expected fantasy points data available (ffopportunity)
 */
export const MIN_FF_OPPORTUNITY_SEASON = 2006;
