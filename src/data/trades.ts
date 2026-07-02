/**
 * Load trade data
 * @module data/trades
 */

import type { Season } from '../types/common.js';
import type { LoadTradesOptions, TradeRecord } from '../types/trades.js';

import { MIN_TRADES_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildTradesUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('trades'));

/**
 * Load NFL trade data
 *
 * Returns trades with one row per asset exchanged (player or draft pick);
 * rows belonging to the same trade share a `trade_id`.
 *
 * Trade data is available from 2002 to the present.
 *
 * Omitting `seasons` loads ALL seasons (same as passing `true`), matching
 * nflreadr::load_trades(). All seasons live in a single file, so the loader
 * fetches once and filters client-side.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2002-present)
 *   - Omit to load ALL available seasons (default)
 * @param options - Load options including format and caching
 * @returns Result containing array of trade records or an error
 *
 * @example
 * ```typescript
 * // Load all trades (2002-present)
 * const result = await loadTrades();
 * if (result.ok) {
 *   const trades = result.value;
 *   console.log(`Loaded ${trades.length} trade assets`);
 *
 *   // Group assets by trade
 *   const byTrade = Map.groupBy(trades, t => t.trade_id);
 *
 *   // Trades involving first-round picks
 *   const firstRounders = trades.filter(t => t.pick_round === 1);
 * }
 *
 * // Load a single season
 * const trades2023 = await loadTrades(2023);
 *
 * // Load multiple seasons
 * const multi = await loadTrades([2022, 2023]);
 *
 * // Use Parquet format for better performance
 * const parquetResult = await loadTrades(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_trades.html
 */
export async function loadTrades(
  seasons?: Season | Season[] | true,
  options: LoadTradesOptions = {}
): Promise<Result<TradeRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    assertValidFormat(format);

    // Default (undefined) loads the full file, matching nflreadr::load_trades
    const loadAll = seasons === undefined || seasons === true;
    let seasonsToLoad: Season[] = [];

    if (!loadAll) {
      seasonsToLoad = normalizeSeasons(seasons, { minSeason: MIN_TRADES_SEASON });
      const validationResult = validateSeasons(seasonsToLoad, {
        minSeason: MIN_TRADES_SEASON,
        allowFuture: true,
        coerce: false,
      });
      if (!validationResult.valid) {
        return Err(validationResult.error!);
      }
    }

    getLogger().info(
      `Loading trades for ${loadAll ? 'all seasons' : `seasons: ${seasonsToLoad.join(', ')}`}`
    );

    // All seasons live in a single file; fetch once and filter
    const url = buildTradesUrl(format);
    getLogger().debug(`Fetching trade data from: ${url}`);

    const client = createDataClient();
    const allTrades = await fetchParsedAsset<TradeRecord>(client, url, format, loadOptions);

    const result = loadAll
      ? allTrades
      : allTrades.filter((trade) => seasonsToLoad.includes(trade.season));

    getLogger().info(`Loaded ${result.length} trade records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load trades', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading trade data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
