/**
 * Participation data type definitions
 * @module types/participation
 */

import type { DateString, GameId, Season, TeamAbbr } from './common';

/**
 * Participation record
 * Contains information about which players were on the field for each play
 *
 * Data Attribution:
 * - Pre-2023: NFL NextGenStats
 * - 2023+: FTN Data
 * - License: CC-BY-SA 4.0
 * - Required attribution: "FTN Data via nflverse" or "NFL NextGenStats via nflverse"
 */
export interface ParticipationRecord {
  // ===== IDENTIFIERS =====
  /** nflverse game identifier (format: season_week_away_home) */
  nflverse_game_id: GameId;
  /** Unique play identifier within game */
  play_id: number;
  /** Legacy NFL game ID format */
  old_game_id?: string | null;

  // ===== GAME INFO =====
  /** Season year */
  season?: Season | null;
  /** Week number */
  week?: number | null;
  /** Game date */
  game_date?: DateString | null;
  /** Home team abbreviation */
  home_team?: TeamAbbr | null;
  /** Away team abbreviation */
  away_team?: TeamAbbr | null;

  // ===== POSSESSION =====
  /** Team with possession */
  possession_team: TeamAbbr | null;

  // ===== OFFENSIVE FORMATION & PERSONNEL =====
  /** Offensive formation at snap */
  offense_formation: string | null;
  /** Offensive personnel grouping (e.g., "1 RB, 1 TE, 3 WR") */
  offense_personnel: string | null;
  /** Comma-separated list of offensive player IDs (gsis_id) */
  offense_players: string | null;
  /** Number of offensive players on field */
  n_offense: number | null;
  /** Comma-separated list of offensive player names */
  offense_names?: string | null;
  /** Comma-separated list of offensive player positions */
  offense_positions?: string | null;
  /** Comma-separated list of offensive player jersey numbers */
  offense_numbers?: string | null;

  // ===== DEFENSIVE PERSONNEL & COVERAGE =====
  /** Defensive personnel grouping (e.g., "4 DL, 3 LB, 4 DB") */
  defense_personnel: string | null;
  /** Comma-separated list of defensive player IDs (gsis_id) */
  defense_players: string | null;
  /** Number of defenders in the box at snap */
  defenders_in_box: number | null;
  /** Number of pass rushers */
  number_of_pass_rushers: number | null;
  /** Number of defensive players on field */
  n_defense: number | null;
  /** Comma-separated list of defensive player names */
  defense_names?: string | null;
  /** Comma-separated list of defensive player positions */
  defense_positions?: string | null;
  /** Comma-separated list of defensive player jersey numbers */
  defense_numbers?: string | null;
  /** Man or zone coverage type */
  defense_man_zone_type: 'Man' | 'Zone' | null;
  /** Specific coverage scheme (Cover 0-6, Cover 9, Combo, Blown, etc.) */
  defense_coverage_type: string | null;

  // ===== PLAY METRICS =====
  /** Time from snap to pass release (seconds) */
  time_to_throw: number | null;
  /** Whether QB faced pressure */
  was_pressure: boolean | null;
  /** Primary receiver's route type */
  route: string | null;
  /** Air yards (legacy field, NA for 2024+) */
  ngs_air_yards: number | null;

  // ===== ADDITIONAL FIELDS =====
  /** Allow for additional fields that may be included when merged with PBP data */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Array of participation records
 */
export type ParticipationData = ParticipationRecord[];

/**
 * Options for loading participation data
 */
export interface LoadParticipationOptions {
  /** File format to load (csv or parquet) */
  format?: 'csv' | 'parquet';
  /** Whether to merge with play-by-play data (not yet implemented) */
  includePbp?: boolean;
}
