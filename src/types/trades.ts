/**
 * Trade data types
 * @module types/trades
 */

import type { Season, TeamAbbr } from './common.js';
import type { LoadOptions } from './utils.js';

/**
 * Trade record representing a single asset moved in a trade
 *
 * This interface matches the nflreadr::load_trades() output structure.
 * Data covers 2002 to present. Each trade spans multiple rows sharing the
 * same `trade_id`, with one row per player or pick exchanged.
 *
 * @see https://nflreadr.nflverse.com/reference/load_trades.html
 */
export interface TradeRecord {
  /**
   * Identifier shared by all rows belonging to the same trade
   */
  trade_id: number;

  /**
   * NFL season the trade counts against
   */
  season: Season;

  /**
   * Date of the trade (ISO format: YYYY-MM-DD)
   * @example "2002-03-04"
   */
  trade_date: string;

  /**
   * Abbreviation of the team giving up this asset
   */
  gave: TeamAbbr;

  /**
   * Abbreviation of the team receiving this asset
   */
  received: TeamAbbr;

  /**
   * Draft year of the traded pick (null if the asset is a player)
   */
  pick_season: number | null;

  /**
   * Round of the traded pick (null if the asset is a player)
   */
  pick_round: number | null;

  /**
   * Overall number of the traded pick (null if the asset is a player)
   */
  pick_number: number | null;

  /**
   * Whether the pick was conditional (0 or 1, null if the asset is a player)
   */
  conditional: number | null;

  /**
   * Pro Football Reference ID of the traded player (null if the asset is a pick)
   */
  pfr_id: string | null;

  /**
   * Name of the traded player (null if the asset is a pick)
   */
  pfr_name: string | null;

  /**
   * Additional columns published by nflverse but not explicitly typed
   */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Options for loading trade data
 */
export interface LoadTradesOptions extends LoadOptions {
  /**
   * File format to use
   * @default 'csv'
   */
  format?: 'csv' | 'parquet';
}
