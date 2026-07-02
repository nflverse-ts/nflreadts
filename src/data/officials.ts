/**
 * Load game officials data
 * @module data/officials
 */

import type { Season } from '../types/common.js';
import type { LoadOfficialsOptions, OfficialRecord } from '../types/officials.js';

import { MIN_OFFICIALS_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildOfficialsUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('officials'));

/**
 * Load NFL game officials
 *
 * Returns officiating crew assignments with one row per official per game,
 * including name, position, jersey number, and game identifiers.
 *
 * Officials data is available from 2015 to the present.
 *
 * Omitting `seasons` loads ALL seasons (same as passing `true`), matching
 * nflreadr::load_officials(). All seasons live in a single file, so the
 * loader fetches once and filters client-side.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2015-present)
 *   - Omit to load ALL available seasons (default)
 * @param options - Load options including format and caching
 * @returns Result containing array of official records or an error
 *
 * @example
 * ```typescript
 * // Load all officials assignments (2015-present)
 * const result = await loadOfficials();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} assignments`);
 *
 *   // All games a referee worked
 *   const hisGames = result.value.filter(o =>
 *     o.official_name === 'Brad Freeman'
 *   );
 * }
 *
 * // Load a single season
 * const officials2023 = await loadOfficials(2023);
 *
 * // Load multiple seasons
 * const multi = await loadOfficials([2022, 2023]);
 *
 * // Use Parquet format for better performance
 * const parquetResult = await loadOfficials(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_officials.html
 */
export async function loadOfficials(
  seasons?: Season | Season[] | true,
  options: LoadOfficialsOptions = {}
): Promise<Result<OfficialRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    assertValidFormat(format);

    // Default (undefined) loads the full file, matching nflreadr::load_officials
    const loadAll = seasons === undefined || seasons === true;
    let seasonsToLoad: Season[] = [];

    if (!loadAll) {
      seasonsToLoad = normalizeSeasons(seasons, { minSeason: MIN_OFFICIALS_SEASON });
      const validationResult = validateSeasons(seasonsToLoad, {
        minSeason: MIN_OFFICIALS_SEASON,
        allowFuture: true,
        coerce: false,
      });
      if (!validationResult.valid) {
        return Err(validationResult.error!);
      }
    }

    getLogger().info(
      `Loading officials for ${loadAll ? 'all seasons' : `seasons: ${seasonsToLoad.join(', ')}`}`
    );

    // All seasons live in a single file; fetch once and filter
    const url = buildOfficialsUrl(format);
    getLogger().debug(`Fetching officials data from: ${url}`);

    const client = createDataClient();
    const allOfficials = await fetchParsedAsset<OfficialRecord>(client, url, format, loadOptions);

    const result = loadAll
      ? allOfficials
      : allOfficials.filter((official) => seasonsToLoad.includes(official.season));

    getLogger().info(`Loaded ${result.length} official records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load officials', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading officials data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
