/**
 * Common type definitions for NFL data
 * @module types/common
 */

/**
 * NFL Season type
 * Valid seasons typically start from 1999 (modern NFL era)
 */
export type Season = number;

/**
 * NFL Week number
 * Regular season: 1-18
 * Playoffs: 19-22 (Wild Card, Divisional, Conference, Super Bowl)
 */
export type Week = number;

/**
 * NFL Season type (regular season, postseason, preseason)
 */
export type SeasonType = 'REG' | 'POST' | 'PRE';

/**
 * NFL Team abbreviation
 * Standard 2-4 character team codes
 */
export type TeamAbbr = string;

/**
 * NFL Player ID
 * Typically GSIS ID format
 */
export type PlayerId = string;

/**
 * NFL Game ID
 * Format: YYYY_WW_AWAY_HOME (e.g., "2023_01_KC_PHI")
 */
export type GameId = string;

/**
 * Play ID
 * Unique identifier for a play within a game
 */
export type PlayId = string;

/**
 * Position abbreviation
 */
export type Position =
  // Offense
  | 'QB'
  | 'RB'
  | 'FB'
  | 'WR'
  | 'TE'
  | 'OL'
  | 'OT'
  | 'OG'
  | 'C'
  // Defense
  | 'DL'
  | 'DE'
  | 'DT'
  | 'NT'
  | 'LB'
  | 'ILB'
  | 'OLB'
  | 'MLB'
  | 'DB'
  | 'CB'
  | 'S'
  | 'SS'
  | 'FS'
  // Special Teams
  | 'K'
  | 'P'
  | 'LS';
// Other

/**
 * Side of the ball
 */
export type Side = 'offense' | 'defense' | 'special';

/**
 * Conference type
 */
export type Conference = 'AFC' | 'NFC';

/**
 * Division type
 */
export type Division = 'East' | 'West' | 'North' | 'South';

/**
 * Full division name
 */
export type FullDivision =
  | 'AFC East'
  | 'AFC West'
  | 'AFC North'
  | 'AFC South'
  | 'NFC East'
  | 'NFC West'
  | 'NFC North'
  | 'NFC South';

/**
 * Play type
 */
export type PlayType =
  | 'pass'
  | 'run'
  | 'punt'
  | 'kickoff'
  | 'field_goal'
  | 'extra_point'
  | 'qb_kneel'
  | 'qb_spike'
  | 'no_play';

/**
 * Down number (1-4)
 */
export type Down = 1 | 2 | 3 | 4;

/**
 * Game result status
 */
export type GameStatus =
  | 'scheduled'
  | 'pregame'
  | 'in_progress'
  | 'final'
  | 'postponed'
  | 'canceled';

/**
 * Date string in ISO format (YYYY-MM-DD)
 */
export type DateString = string;

/**
 * Timestamp string in ISO format
 */
export type Timestamp = string;
