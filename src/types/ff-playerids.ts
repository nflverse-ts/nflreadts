/**
 * Fantasy football player ID crosswalk type definitions
 * @module types/ff-playerids
 */

import type { Season, TeamAbbr } from './common.js';

/**
 * Fantasy football player ID record (DynastyProcess.com crosswalk)
 *
 * Maps a player's identifiers across fantasy platforms and data providers.
 * ID columns are typed `string | number | null` because some platforms use
 * numeric IDs and others alphanumeric; missing IDs appear as the string "NA"
 * in the source CSV.
 *
 * Data Attribution: DynastyProcess.com
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_playerids.html
 */
export interface FfPlayeridsRecord {
  /** MyFantasyLeague player ID (the crosswalk's primary key) */
  mfl_id: number;
  /** Sportradar UUID */
  sportradar_id: string | number | null;
  /** FantasyPros player ID */
  fantasypros_id: string | number | null;
  /** NFL GSIS player ID */
  gsis_id: string | number | null;
  /** Pro Football Focus player ID */
  pff_id: string | number | null;
  /** Sleeper player ID */
  sleeper_id: string | number | null;
  /** NFL.com player ID */
  nfl_id: string | number | null;
  /** ESPN player ID */
  espn_id: string | number | null;
  /** Yahoo player ID */
  yahoo_id: string | number | null;
  /** Fleaflicker player ID */
  fleaflicker_id: string | number | null;
  /** CBS player ID */
  cbs_id: string | number | null;
  /** Pro Football Reference player ID */
  pfr_id: string | number | null;
  /** College Football Reference player ID */
  cfbref_id: string | number | null;
  /** Rotowire player ID */
  rotowire_id: string | number | null;
  /** Rotoworld player ID */
  rotoworld_id: string | number | null;
  /** KeepTradeCut player ID */
  ktc_id: string | number | null;
  /** Stats player ID */
  stats_id: string | number | null;
  /** Stats global player ID */
  stats_global_id: string | number | null;
  /** FantasyData player ID */
  fantasy_data_id: string | number | null;
  /** Swish Analytics player ID */
  swish_id: string | number | null;
  /** Player name */
  name: string;
  /** Lowercase name used for fuzzy joins */
  merge_name: string | null;
  /** Position abbreviation */
  position: string | null;
  /** Team abbreviation (MFL-style, e.g. "KCC") */
  team: TeamAbbr | null;
  /** Birthdate (YYYY-MM-DD) */
  birthdate: string | null;
  /** Age in years (decimal) */
  age: number | null;
  /** NFL draft year */
  draft_year: Season | null;
  /** NFL draft round */
  draft_round: number | null;
  /** Pick number within the draft round */
  draft_pick: number | null;
  /** Overall draft pick number */
  draft_ovr: number | null;
  /** Twitter/X username */
  twitter_username: string | null;
  /** Height in inches */
  height: number | null;
  /** Weight in pounds */
  weight: number | null;
  /** College attended */
  college: string | null;
  /** Season the row was last updated in the database */
  db_season: Season | null;

  /** Allow additional ID columns DynastyProcess may add over time */
  [key: string]: string | number | boolean | null | undefined;
}
