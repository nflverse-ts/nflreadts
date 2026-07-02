/**
 * Player contract data types (OverTheCap)
 * @module types/contracts
 */

import type { LoadOptions } from './utils.js';

/**
 * Per-season salary cap detail for a contract
 *
 * Present in the nested `cols` field of {@link ContractRecord} when loading
 * the parquet asset. All dollar figures are in millions.
 */
export interface ContractSeasonDetail {
  /**
   * Contract year
   * @example "2023"
   */
  year: string | null;

  /**
   * Team name for that contract year
   */
  team: string | null;

  /**
   * Base salary (millions)
   */
  base_salary: number | null;

  /**
   * Prorated signing bonus (millions)
   */
  prorated_bonus: number | null;

  /**
   * Roster bonus (millions)
   */
  roster_bonus: number | null;

  /**
   * Guaranteed salary (millions)
   */
  guaranteed_salary: number | null;

  /**
   * Salary cap number (millions)
   */
  cap_number: number | null;

  /**
   * Share of team salary cap (0-1)
   */
  cap_percent: number | null;

  /**
   * Cash paid to the player that year (millions)
   */
  cash_paid: number | null;

  /**
   * Workout bonus (millions)
   */
  workout_bonus: number | null;

  /**
   * Other bonus amounts (millions)
   */
  other_bonus: number | null;

  /**
   * Per-game roster bonus (millions)
   */
  per_game_roster_bonus: number | null;

  /**
   * Option bonus (millions)
   */
  option_bonus: number | null;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Contract record representing a single player contract
 *
 * This interface matches the nflreadr::load_contracts() output structure.
 * Data is sourced from OverTheCap and includes every historical contract,
 * not just each player's current one. Dollar figures are in millions.
 *
 * @see https://nflreadr.nflverse.com/reference/load_contracts.html
 */
export interface ContractRecord {
  /**
   * Player's full name
   */
  player: string;

  /**
   * Position of the player
   */
  position: string | null;

  /**
   * Team name the contract was signed with
   * @example "Bengals"
   */
  team: string | null;

  /**
   * Whether this contract is currently active
   */
  is_active: boolean;

  /**
   * Year the contract was signed
   */
  year_signed: number;

  /**
   * Contract length in years
   */
  years: number | null;

  /**
   * Total contract value (millions)
   */
  value: number | null;

  /**
   * Average per year (millions)
   */
  apy: number | null;

  /**
   * Total guaranteed money (millions)
   */
  guaranteed: number | null;

  /**
   * APY as a share of the salary cap at signing (0-1)
   */
  apy_cap_pct: number | null;

  /**
   * Contract value inflated to current cap environment (millions)
   */
  inflated_value: number | null;

  /**
   * APY inflated to current cap environment (millions)
   */
  inflated_apy: number | null;

  /**
   * Guaranteed money inflated to current cap environment (millions)
   */
  inflated_guaranteed: number | null;

  /**
   * OverTheCap player page URL
   */
  player_page: string | null;

  /**
   * OverTheCap player ID
   */
  otc_id: number | null;

  /**
   * GSIS ID (primary nflverse play-by-play identifier)
   */
  gsis_id: string | null;

  /**
   * Player's date of birth
   */
  date_of_birth: string | null;

  /**
   * Player's height
   * @example "6'4\""
   */
  height: string | null;

  /**
   * Player's weight in pounds (published as a string)
   */
  weight: string | null;

  /**
   * College the player attended
   */
  college: string | null;

  /**
   * Year the player was drafted (null if undrafted)
   */
  draft_year: number | null;

  /**
   * Round the player was drafted in (null if undrafted)
   */
  draft_round: number | null;

  /**
   * Overall draft pick number (null if undrafted)
   */
  draft_overall: number | null;

  /**
   * Team name that drafted the player (null if undrafted)
   */
  draft_team: string | null;

  /**
   * Nested per-season salary cap detail (parquet format only)
   */
  cols: ContractSeasonDetail[] | null;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | ContractSeasonDetail[] | null | undefined;
}

/**
 * Options for loading contract data
 */
export interface LoadContractsOptions extends LoadOptions {
  /**
   * File format to use
   *
   * Defaults to 'parquet' because nflverse does not publish a plain .csv
   * asset for contracts (only .csv.gz and .parquet exist in the release).
   * @default 'parquet'
   */
  format?: 'csv' | 'parquet';
}
