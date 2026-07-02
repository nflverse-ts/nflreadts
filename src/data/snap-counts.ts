/**
 * Snap count data loading functions
 * @module data/snapcounts
 */

import type { HttpClient } from '../client/client.js';
import type { Season } from '../types/common.js';
import { MIN_SNAP_COUNT_SEASON } from '../types/constants.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  LoadSnapCountsOptions,
  SnapCountData,
  SnapCountRecord,
} from '../types/snap-counts.js';

import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildSnapCountsUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('loadSnapCounts'));

/**
 * Load snap counts for one or more NFL seasons
 *
 * This function fetches game-level snap count data from the nflverse data
 * repository (the `snap_counts` release, sourced from Pro Football
 * Reference). Each row is one player's offensive, defensive, and special
 * teams snap totals and percentages for a single game.
 *
 * Snap count data is available from 2012 onward.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2012-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of snap count records or an error
 *
 * @example
 * ```typescript
 * // Load current season snap counts
 * const snaps = await loadSnapCounts();
 *
 * // Load specific season
 * const snaps2023 = await loadSnapCounts(2023);
 *
 * // Load multiple seasons
 * const snapsMulti = await loadSnapCounts([2022, 2023]);
 *
 * // Load all available data (2012+)
 * const snapsAll = await loadSnapCounts(true);
 *
 * // Load with parquet format (faster, smaller file size)
 * const snapsParquet = await loadSnapCounts(2023, { format: 'parquet' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_snap_counts.html | nflreadr::load_snap_counts}
 */
export async function loadSnapCounts(
  seasons?: Season | Season[] | true,
  options: LoadSnapCountsOptions = {}
): Promise<Result<SnapCountData, Error>> {
  const { format = 'csv' } = options;

  try {
    // Determine which seasons to load (snap counts available from 2012 onward)
    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_SNAP_COUNT_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().debug(`Loading snap counts for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront (both general and dataset-specific)
    for (const season of seasonsToLoad) {
      assertValidSeason(season);

      if (season < MIN_SNAP_COUNT_SEASON) {
        throw new Error(
          `Snap count data is only available from ${MIN_SNAP_COUNT_SEASON} onward. Requested season: ${season}`
        );
      }
    }

    const client = createDataClient();

    // Load data for each season in parallel
    const results = await Promise.all(
      seasonsToLoad.map((season) => loadSnapCountsForSeason(season, format, client))
    );

    const dataArrays: SnapCountData[] = [];
    for (const result of results) {
      if (result.ok) {
        dataArrays.push(result.value);
      } else {
        // If any season fails, return the error
        return result;
      }
    }

    const allData = concatSeasons(dataArrays);

    getLogger().debug(`Loaded ${allData.length} snap count records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load snap counts', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load snap counts for a single season
 */
async function loadSnapCountsForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<SnapCountData, Error>> {
  const url = buildSnapCountsUrl(season, format);

  try {
    getLogger().debug(`Fetching snap counts from: ${url}`);

    const data = await fetchParsedAsset<SnapCountRecord>(client, url, format);

    getLogger().debug(`Parsed ${data.length} snap count records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      getLogger().error(`Failed to load snap counts for season ${season}`, error);

      // Convert to appropriate error type
      if (error instanceof DataNotFoundError) {
        return Err(
          new DataNotFoundError(`Snap count data not found for season ${season}`, {
            season,
            url,
          })
        );
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading snap counts for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading snap counts for season ${season}`));
  }
}
