/**
 * Common type definitions for NFL data
 * @module types/common
 *
 * Core domain types (Season, Week, SeasonType, etc.) come from the shared
 * `@nflverse/types` foundation package and are re-exported here so existing
 * imports keep working.
 */

export type {
  Season,
  Week,
  SeasonType,
  DateString,
  Down,
  Conference,
  Division,
  Position,
  /** NFL Team abbreviation (standard 2-4 character team codes) */
  Team as TeamAbbr,
} from '@nflverse/types';

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
 * Side of the ball
 */
export type Side = 'offense' | 'defense' | 'special';

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
 * Timestamp string in ISO format
 */
export type Timestamp = string;

/**
 * Game type for roster entries
 */
export type GameType = 'REG' | 'POST' | 'PRE';
