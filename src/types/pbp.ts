/**
 * Play-by-play data type definitions
 * @module types/pbp
 */

import type {
  DateString,
  Down,
  GameId,
  PlayerId,
  Season,
  SeasonType,
  TeamAbbr,
  Timestamp,
  Week,
} from './common';

/**
 * Play-by-play record
 * Contains detailed information about a single play in an NFL game
 *
 * Note: The actual nflfastR dataset contains 372+ fields. This interface
 * defines the most commonly used fields with strong typing, while allowing
 * additional fields through index signature.
 */
export interface PlayByPlayRecord {
  // ===== IDENTIFIERS =====
  /** Unique identifier for the play */
  play_id: number;
  /** Ten digit game identifier */
  game_id: GameId;
  /** Unique identifier for the game on the old NFL platform */
  old_game_id?: string;
  /** Season year (4 digits) */
  season: Season;
  /** Season week number */
  week: Week;
  /** Season type (REG, POST, PRE) */
  season_type: SeasonType;
  /** Game date in YYYY-MM-DD format */
  game_date: DateString;

  // ===== TEAMS =====
  /** Home team abbreviation */
  home_team: TeamAbbr;
  /** Away team abbreviation */
  away_team: TeamAbbr;
  /** Team with possession */
  posteam: TeamAbbr | null;
  /** Defensive team */
  defteam: TeamAbbr | null;
  /** Whether possession team is home or away */
  posteam_type: 'home' | 'away' | null;

  // ===== FIELD POSITION =====
  /** Numeric yards from opponent's end zone (0-100) */
  yardline_100: number | null;
  /** Which team's side of field */
  side_of_field: TeamAbbr | null;
  /** String describing yard line at end of play */
  end_yard_line: string | null;

  // ===== DOWN & DISTANCE =====
  /** Down number (1-4) */
  down: Down | null;
  /** Yards to go for first down */
  ydstogo: number | null;
  /** Binary indicator for whether play is in goal down situation */
  goal_to_go: 0 | 1 | null;

  // ===== PLAY DETAILS =====
  /** Type of play */
  play_type:
    | 'pass'
    | 'run'
    | 'punt'
    | 'field_goal'
    | 'kickoff'
    | 'extra_point'
    | 'qb_kneel'
    | 'qb_spike'
    | 'no_play'
    | null;
  /** Detailed play description */
  desc: string | null;
  /** Net yards gained or lost on play */
  yards_gained: number | null;

  // ===== PASSING =====
  /** Pass length category */
  pass_length: 'short' | 'deep' | null;
  /** Pass location on field */
  pass_location: 'left' | 'middle' | 'right' | null;
  /** Air yards (perpendicular to line of scrimmage) */
  air_yards: number | null;
  /** Yards after catch */
  yards_after_catch: number | null;
  /** Binary indicator for complete pass */
  complete_pass: 0 | 1 | null;
  /** Binary indicator for incomplete pass */
  incomplete_pass: 0 | 1 | null;
  /** Binary indicator for pass attempt */
  pass_attempt: 0 | 1 | null;
  /** Passer player ID */
  passer_player_id: PlayerId | null;
  /** Passer player name */
  passer_player_name: string | null;
  /** Receiver player ID */
  receiver_player_id: PlayerId | null;
  /** Receiver player name */
  receiver_player_name: string | null;
  /** Passing yards */
  passing_yards: number | null;
  /** Receiving yards */
  receiving_yards: number | null;

  // ===== RUSHING =====
  /** Run location on field */
  run_location: 'left' | 'middle' | 'right' | null;
  /** Run gap */
  run_gap: 'end' | 'guard' | 'tackle' | null;
  /** Binary indicator for rush attempt */
  rush_attempt: 0 | 1 | null;
  /** Rusher player ID */
  rusher_player_id: PlayerId | null;
  /** Rusher player name */
  rusher_player_name: string | null;
  /** Rushing yards */
  rushing_yards: number | null;

  // ===== SCORING =====
  /** Binary indicator for touchdown */
  touchdown: 0 | 1 | null;
  /** Binary indicator for passing touchdown */
  pass_touchdown: 0 | 1 | null;
  /** Binary indicator for rushing touchdown */
  rush_touchdown: 0 | 1 | null;
  /** Binary indicator for return touchdown */
  return_touchdown: 0 | 1 | null;
  /** Binary indicator for field goal attempt */
  field_goal_attempt: 0 | 1 | null;
  /** Field goal result */
  field_goal_result: 'made' | 'missed' | 'blocked' | null;
  /** Binary indicator for extra point attempt */
  extra_point_attempt: 0 | 1 | null;
  /** Extra point result */
  extra_point_result: 'good' | 'failed' | 'blocked' | 'aborted' | null;
  /** Binary indicator for two point conversion attempt */
  two_point_attempt: 0 | 1 | null;
  /** Two point conversion result */
  two_point_conv_result: 'success' | 'failure' | null;

  // ===== SCORE =====
  /** Home team score at start of play */
  total_home_score: number | null;
  /** Away team score at start of play */
  total_away_score: number | null;
  /** Possession team score at start of play */
  posteam_score: number | null;
  /** Defensive team score at start of play */
  defteam_score: number | null;
  /** Score differential (posteam - defteam) */
  score_differential: number | null;
  /** Possession team score after play */
  posteam_score_post: number | null;
  /** Defensive team score after play */
  defteam_score_post: number | null;

  // ===== EXPECTED POINTS (EPA) =====
  /** Expected points for possession team at start of play */
  ep: number | null;
  /** Expected points added by play */
  epa: number | null;
  /** Binary indicator for EPA > 0 */
  success: 0 | 1 | null;

  // ===== WIN PROBABILITY (WP) =====
  /** Win probability for possession team at start of play */
  wp: number | null;
  /** Win probability for home team */
  home_wp: number | null;
  /** Win probability for away team */
  away_wp: number | null;
  /** Win probability added by play */
  wpa: number | null;

  // ===== DEFENSIVE PLAYS =====
  /** Binary indicator for sack */
  sack: 0 | 1 | null;
  /** Binary indicator for interception */
  interception: 0 | 1 | null;
  /** Binary indicator for fumble */
  fumble: 0 | 1 | null;
  /** Binary indicator for fumble lost */
  fumble_lost: 0 | 1 | null;
  /** Binary indicator for tackle for loss */
  tackle_for_loss: 0 | 1 | null;
  /** Binary indicator for safety */
  safety: 0 | 1 | null;

  // ===== SPECIAL TEAMS =====
  /** Binary indicator for kickoff attempt */
  kickoff_attempt: 0 | 1 | null;
  /** Binary indicator for punt attempt */
  punt_attempt: 0 | 1 | null;
  /** Binary indicator for punt blocked */
  punt_blocked: 0 | 1 | null;
  /** Kickoff returner player name */
  kickoff_returner_player_name: string | null;
  /** Punt returner player name */
  punt_returner_player_name: string | null;

  // ===== TIME & CLOCK =====
  /** Seconds remaining in quarter */
  quarter_seconds_remaining: number | null;
  /** Seconds remaining in game */
  game_seconds_remaining: number | null;
  /** Quarter number (5 = overtime) */
  qtr: number | null;
  /** Time of day in UTC */
  time_of_day: Timestamp | null;
  /** Play clock time */
  play_clock: number | null;

  // ===== DRIVE INFORMATION =====
  /** Drive number in game */
  drive: number | null;
  /** Number of plays in current drive */
  drive_play_count: number | null;
  /** Time of possession for drive */
  drive_time_of_possession: string | null;
  /** First downs in drive */
  drive_first_downs: number | null;
  /** Whether drive ended in a score */
  drive_ended_with_score: 0 | 1 | null;

  // ===== GAME SITUATION =====
  /** Binary indicator for timeout */
  timeout: 0 | 1 | null;
  /** Team that called timeout */
  timeout_team: TeamAbbr | null;
  /** Binary indicator for penalty */
  penalty: 0 | 1 | null;
  /** Team that committed penalty */
  penalty_team: TeamAbbr | null;
  /** Type of penalty */
  penalty_type: string | null;
  /** Penalty yards */
  penalty_yards: number | null;
  /** Vegas spread line for game */
  spread_line: number | null;
  /** Total points over/under line */
  total_line: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields from the 372+ column dataset */
  [key: string]: string | number | null | undefined;
}

/**
 * Array of play-by-play records
 */
export type PlayByPlayData = PlayByPlayRecord[];

/**
 * Options for loading play-by-play data
 */
export interface LoadPbpOptions {
  /** File format to load (csv or parquet) */
  format?: 'csv' | 'parquet';
}
