/**
 * Schedule and game data types
 * @module types/schedule
 */

import type { Season, TeamAbbr, Week } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Specific game type classification for schedules
 * More granular than SeasonType, breaking down playoffs into specific rounds
 */
export type ScheduleGameType = 'REG' | 'WC' | 'DIV' | 'CON' | 'SB' | 'PRE';

/**
 * Day of the week
 */
export type Weekday =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

/**
 * Game location type
 */
export type LocationType = 'Home' | 'Neutral';

/**
 * Stadium roof type
 */
export type RoofType = 'outdoors' | 'dome' | 'closed' | 'open' | 'retractable';

/**
 * Stadium surface type
 */
export type SurfaceType = 'grass' | 'turf' | 'fieldturf' | 'astroturf' | 'matrixturf' | 'sportturf';

/**
 * Schedule record representing a single game
 *
 * This interface matches the nflreadr::load_schedules() output structure
 * Data is maintained by Lee Sharpe
 *
 * @see https://nflreadr.nflverse.com/reference/load_schedules.html
 */
export interface ScheduleRecord {
  /**
   * Unique game identifier (nflverse format)
   * @example "2020_01_TB_NO"
   */
  game_id: string;

  /**
   * NFL season (year of the season, not the calendar year of the game)
   */
  season: Season;

  /**
   * Game type classification
   * - REG: Regular season
   * - WC: Wild Card
   * - DIV: Divisional
   * - CON: Conference Championship
   * - SB: Super Bowl
   * - PRE: Preseason
   */
  game_type: ScheduleGameType;

  /**
   * Week number within the season
   */
  week: Week;

  /**
   * Date of the game (ISO format: YYYY-MM-DD)
   * @example "2020-09-13"
   */
  gameday: string;

  /**
   * Day of the week
   */
  weekday: Weekday;

  /**
   * Scheduled game time (ET format: HH:MM)
   * @example "13:00"
   */
  gametime: string;

  /**
   * Away team abbreviation
   */
  away_team: TeamAbbr;

  /**
   * Away team score (null if game hasn't been played)
   */
  away_score: number | null;

  /**
   * Home team abbreviation
   */
  home_team: TeamAbbr;

  /**
   * Home team score (null if game hasn't been played)
   */
  home_score: number | null;

  /**
   * Location type (Home or Neutral)
   */
  location: LocationType | null;

  /**
   * Point differential from home team perspective (home_score - away_score)
   * Positive means home team won, negative means away team won
   */
  result: number | null;

  /**
   * Combined total points (home_score + away_score)
   */
  total: number | null;

  /**
   * Overtime indicator
   * - 0: No overtime
   * - 1: Overtime occurred
   */
  overtime: number | null;

  /**
   * Legacy game identifier
   */
  old_game_id: string | null;

  /**
   * NFL Game Statistics and Information System ID
   */
  gsis: string | null;

  /**
   * NFL detail page ID
   */
  nfl_detail_id: string | null;

  /**
   * Pro Football Reference game ID
   */
  pfr: string | null;

  /**
   * Pro Football Focus game ID
   */
  pff: string | null;

  /**
   * ESPN game ID
   */
  espn: string | null;

  /**
   * FantasyData / numberFire / The Football Database game ID
   */
  ftn: string | null;

  /**
   * Away team rest days since previous game
   */
  away_rest: number | null;

  /**
   * Home team rest days since previous game
   */
  home_rest: number | null;

  /**
   * Away team moneyline odds
   */
  away_moneyline: number | null;

  /**
   * Home team moneyline odds
   */
  home_moneyline: number | null;

  /**
   * Point spread line (negative means favorite)
   * From home team perspective
   */
  spread_line: number | null;

  /**
   * Away team spread odds
   */
  away_spread_odds: number | null;

  /**
   * Home team spread odds
   */
  home_spread_odds: number | null;

  /**
   * Total points over/under line
   */
  total_line: number | null;

  /**
   * Under odds
   */
  under_odds: number | null;

  /**
   * Over odds
   */
  over_odds: number | null;

  /**
   * Division game indicator
   */
  div_game: number | null;

  /**
   * Stadium roof type
   */
  roof: RoofType | null;

  /**
   * Field surface type
   */
  surface: SurfaceType | null;

  /**
   * Temperature at kickoff (Fahrenheit)
   */
  temp: number | null;

  /**
   * Wind speed at kickoff (mph)
   */
  wind: number | null;

  /**
   * Away team quarterback
   */
  away_qb_id: string | null;

  /**
   * Away team quarterback name
   */
  away_qb_name: string | null;

  /**
   * Home team quarterback
   */
  home_qb_id: string | null;

  /**
   * Home team quarterback name
   */
  home_qb_name: string | null;

  /**
   * Away team head coach
   */
  away_coach: string | null;

  /**
   * Home team head coach
   */
  home_coach: string | null;

  /**
   * Referee for the game
   */
  referee: string | null;

  /**
   * Stadium name
   */
  stadium: string | null;

  /**
   * Stadium identifier
   */
  stadium_id: string | null;
}

/**
 * Options for loading schedule data
 */
export interface LoadSchedulesOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
