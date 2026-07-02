/**
 * Load NFL draft pick data
 * @module data/draft-picks
 */

import type { Season } from '../types/common.js';
import type { DraftPickRecord, LoadDraftPicksOptions } from '../types/draft-picks.js';

import { MIN_DRAFT_PICKS_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildDraftPicksUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('draft-picks'));

/**
 * Load NFL draft pick data
 *
 * Returns every draft selection with pick metadata (round, pick, team) and
 * career outcome statistics (games, Approximate Value, passing/rushing/
 * receiving/defense totals). Data is sourced from Pro Football Reference.
 *
 * Draft pick data is available from 1980 to the present.
 *
 * Omitting `seasons` loads ALL seasons (same as passing `true`), matching
 * nflreadr::load_draft_picks(). All seasons live in a single file, so the
 * loader fetches once and filters client-side.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single draft year (e.g., 2023)
 *   - Array of draft years (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (1980-present)
 *   - Omit to load ALL available seasons (default)
 * @param options - Load options including format and caching
 * @returns Result containing array of draft pick records or an error
 *
 * @example
 * ```typescript
 * // Load all draft picks (1980-present)
 * const result = await loadDraftPicks();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} draft picks`);
 *
 *   // First overall picks
 *   const firstOverall = result.value.filter(pick => pick.pick === 1);
 * }
 *
 * // Load a single draft class
 * const class2023 = await loadDraftPicks(2023);
 *
 * // Load multiple draft classes
 * const classes = await loadDraftPicks([2022, 2023]);
 *
 * // Use Parquet format for better performance
 * const parquetResult = await loadDraftPicks(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_draft_picks.html
 */
export async function loadDraftPicks(
  seasons?: Season | Season[] | true,
  options: LoadDraftPicksOptions = {}
): Promise<Result<DraftPickRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    assertValidFormat(format);

    // Default (undefined) loads the full file, matching nflreadr::load_draft_picks
    const loadAll = seasons === undefined || seasons === true;
    let seasonsToLoad: Season[] = [];

    if (!loadAll) {
      seasonsToLoad = normalizeSeasons(seasons, { minSeason: MIN_DRAFT_PICKS_SEASON });
      const validationResult = validateSeasons(seasonsToLoad, {
        minSeason: MIN_DRAFT_PICKS_SEASON,
        allowFuture: true,
        coerce: false,
      });
      if (!validationResult.valid) {
        return Err(validationResult.error!);
      }
    }

    getLogger().info(
      `Loading draft picks for ${loadAll ? 'all seasons' : `seasons: ${seasonsToLoad.join(', ')}`}`
    );

    // All draft history lives in a single file; fetch once and filter
    const url = buildDraftPicksUrl(format);
    getLogger().debug(`Fetching draft pick data from: ${url}`);

    const client = createDataClient();
    const allPicks = await fetchParsedAsset<DraftPickRecord>(client, url, format, loadOptions);

    const result = loadAll
      ? allPicks
      : allPicks.filter((pick) => seasonsToLoad.includes(pick.season));

    getLogger().info(`Loaded ${result.length} draft pick records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load draft picks', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading draft pick data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
