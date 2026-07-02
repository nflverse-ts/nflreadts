/**
 * Load NFL Scouting Combine data
 * @module data/combine
 */

import type { CombineRecord, LoadCombineOptions } from '../types/combine.js';
import type { Season } from '../types/common.js';

import { MIN_COMBINE_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildCombineUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('combine'));

/**
 * Load NFL Scouting Combine results
 *
 * Returns per-player combine measurements and workout results (40-yard dash,
 * bench press, vertical, broad jump, three-cone, shuttle) along with draft
 * outcome. Data is sourced from Pro Football Reference.
 *
 * Combine data is available from 2000 to the present.
 *
 * Omitting `seasons` loads ALL seasons (same as passing `true`), matching
 * nflreadr::load_combine(). All seasons live in a single file, so the loader
 * fetches once and filters client-side.
 *
 * @param seasons - Combine year(s) to load. Can be:
 *   - Single year (e.g., 2023)
 *   - Array of years (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2000-present)
 *   - Omit to load ALL available seasons (default)
 * @param options - Load options including format and caching
 * @returns Result containing array of combine records or an error
 *
 * @example
 * ```typescript
 * // Load all combine results (2000-present)
 * const result = await loadCombine();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} combine results`);
 *
 *   // Fastest 40 times among wide receivers
 *   const fastWrs = result.value
 *     .filter(p => p.pos === 'WR' && p.forty !== null)
 *     .sort((a, b) => a.forty! - b.forty!);
 * }
 *
 * // Load a single combine class
 * const combine2023 = await loadCombine(2023);
 *
 * // Load multiple combine classes
 * const classes = await loadCombine([2022, 2023]);
 *
 * // Parquet is the default; pass 'csv' if you need CSV
 * const csvResult = await loadCombine(2023, { format: 'csv' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_combine.html
 */
export async function loadCombine(
  seasons?: Season | Season[] | true,
  options: LoadCombineOptions = {}
): Promise<Result<CombineRecord[], Error>> {
  const { format = 'parquet', ...loadOptions } = options;

  try {
    assertValidFormat(format);

    // Default (undefined) loads the full file, matching nflreadr::load_combine
    const loadAll = seasons === undefined || seasons === true;
    let seasonsToLoad: Season[] = [];

    if (!loadAll) {
      seasonsToLoad = normalizeSeasons(seasons, { minSeason: MIN_COMBINE_SEASON });
      const validationResult = validateSeasons(seasonsToLoad, {
        minSeason: MIN_COMBINE_SEASON,
        allowFuture: true,
        coerce: false,
      });
      if (!validationResult.valid) {
        return Err(validationResult.error!);
      }
    }

    getLogger().info(
      `Loading combine results for ${loadAll ? 'all seasons' : `seasons: ${seasonsToLoad.join(', ')}`}`
    );

    // All combine history lives in a single file; fetch once and filter
    const url = buildCombineUrl(format);
    getLogger().debug(`Fetching combine data from: ${url}`);

    const client = createDataClient();
    const allResults = await fetchParsedAsset<CombineRecord>(client, url, format, loadOptions);

    const result = loadAll
      ? allResults
      : allResults.filter((player) => seasonsToLoad.includes(player.season));

    getLogger().info(`Loaded ${result.length} combine records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load combine data', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading combine data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
