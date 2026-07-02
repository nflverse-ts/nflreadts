/**
 * Draft pick data types
 * @module types/draft-picks
 */

import type { Season, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Draft pick record representing a single NFL draft selection
 *
 * This interface matches the nflreadr::load_draft_picks() output structure.
 * Data is sourced from Pro Football Reference and covers 1980 to present.
 *
 * @see https://nflreadr.nflverse.com/reference/load_draft_picks.html
 */
export interface DraftPickRecord {
  /**
   * Draft year (NFL season the player was drafted into)
   */
  season: Season;

  /**
   * Draft round
   */
  round: number;

  /**
   * Overall pick number
   */
  pick: number;

  /**
   * Abbreviation of the drafting team
   */
  team: TeamAbbr;

  /**
   * GSIS ID (primary nflverse play-by-play identifier)
   */
  gsis_id: string | null;

  /**
   * Pro Football Reference player ID
   */
  pfr_player_id: string | null;

  /**
   * College Football Reference player ID
   */
  cfb_player_id: string | null;

  /**
   * Player name as listed by Pro Football Reference
   */
  pfr_player_name: string | null;

  /**
   * Whether the player is in the Hall of Fame
   */
  hof: boolean | null;

  /**
   * Position the player was drafted at
   */
  position: string | null;

  /**
   * Broad position category (e.g., QB, RB, DL, DB)
   */
  category: string | null;

  /**
   * Side of the ball (O = offense, D = defense, S = special teams)
   */
  side: string | null;

  /**
   * College the player was drafted out of
   */
  college: string | null;

  /**
   * Player's age during their draft year
   */
  age: number | null;

  /**
   * Final NFL season the player appeared in
   */
  to: number | null;

  /**
   * Number of first-team All-Pro selections
   */
  allpro: number | null;

  /**
   * Number of Pro Bowl selections
   */
  probowls: number | null;

  /**
   * Number of seasons as a primary starter
   */
  seasons_started: number | null;

  /**
   * Weighted career Approximate Value (PFR)
   */
  w_av: number | null;

  /**
   * Career Approximate Value (PFR)
   */
  car_av: number | null;

  /**
   * Approximate Value accrued with the drafting team (PFR)
   */
  dr_av: number | null;

  /**
   * Career games played
   */
  games: number | null;

  /**
   * Career pass completions
   */
  pass_completions: number | null;

  /**
   * Career pass attempts
   */
  pass_attempts: number | null;

  /**
   * Career passing yards
   */
  pass_yards: number | null;

  /**
   * Career passing touchdowns
   */
  pass_tds: number | null;

  /**
   * Career interceptions thrown
   */
  pass_ints: number | null;

  /**
   * Career rush attempts
   */
  rush_atts: number | null;

  /**
   * Career rushing yards
   */
  rush_yards: number | null;

  /**
   * Career rushing touchdowns
   */
  rush_tds: number | null;

  /**
   * Career receptions
   */
  receptions: number | null;

  /**
   * Career receiving yards
   */
  rec_yards: number | null;

  /**
   * Career receiving touchdowns
   */
  rec_tds: number | null;

  /**
   * Career solo tackles
   */
  def_solo_tackles: number | null;

  /**
   * Career interceptions (defense)
   */
  def_ints: number | null;

  /**
   * Career sacks
   */
  def_sacks: number | null;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading draft pick data
 */
export interface LoadDraftPicksOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
