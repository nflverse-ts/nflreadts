/**
 * FTN charting data loading functions
 * @module data/ftncharting
 */

import type { HttpClient } from '../client/client.js';
import type { Season } from '../types/common.js';
import { MIN_FTN_SEASON } from '../types/constants.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  FtnChartingData,
  FtnChartingRecord,
  LoadFtnChartingOptions,
} from '../types/ftn-charting.js';

import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildFtnChartingUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('loadFtnCharting'));

/**
 * Load FTN charting data for one or more NFL seasons
 *
 * This function fetches manually charted play-level data from the nflverse
 * data repository (the `ftn_charting` release). FTN charts every play with
 * details not in the official feed: formations, motion, play action, screens,
 * RPOs, blitzers, pass rushers, ball placement, drops, and QB decision
 * grading. Records join to play-by-play via `nflverse_game_id` and
 * `nflverse_play_id`.
 *
 * FTN charting data is available from 2022 onward.
 *
 * **Data Attribution:**
 * - Source: FTN Data via nflverse
 * - License: CC-BY-SA 4.0
 * - Required attribution: "FTN Data via nflverse"
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2022-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of FTN charting records or an error
 *
 * @example
 * ```typescript
 * // Load current season charting data
 * const charting = await loadFtnCharting();
 *
 * // Load specific season
 * const charting2023 = await loadFtnCharting(2023);
 *
 * // Load multiple seasons
 * const chartingMulti = await loadFtnCharting([2022, 2023]);
 *
 * // Load all available data (2022+)
 * const chartingAll = await loadFtnCharting(true);
 *
 * // Parquet is the default; pass 'csv' if you need CSV
 * const chartingCsv = await loadFtnCharting(2023, { format: 'csv' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_ftn_charting.html | nflreadr::load_ftn_charting}
 */
export async function loadFtnCharting(
  seasons?: Season | Season[] | true,
  options: LoadFtnChartingOptions = {}
): Promise<Result<FtnChartingData, Error>> {
  const { format = 'parquet' } = options;

  try {
    // Determine which seasons to load (FTN charting available from 2022 onward)
    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_FTN_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().debug(`Loading FTN charting data for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront (both general and dataset-specific)
    for (const season of seasonsToLoad) {
      assertValidSeason(season);

      if (season < MIN_FTN_SEASON) {
        throw new Error(
          `FTN charting data is only available from ${MIN_FTN_SEASON} onward. Requested season: ${season}`
        );
      }
    }

    const client = createDataClient();

    // Load data for each season in parallel
    const results = await Promise.all(
      seasonsToLoad.map((season) => loadFtnChartingForSeason(season, format, client))
    );

    const dataArrays: FtnChartingData[] = [];
    for (const result of results) {
      if (result.ok) {
        dataArrays.push(result.value);
      } else {
        // If any season fails, return the error
        return result;
      }
    }

    const allData = concatSeasons(dataArrays);

    getLogger().debug(`Loaded ${allData.length} FTN charting records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load FTN charting data', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load FTN charting data for a single season
 */
async function loadFtnChartingForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<FtnChartingData, Error>> {
  const url = buildFtnChartingUrl(season, format);

  try {
    getLogger().debug(`Fetching FTN charting data from: ${url}`);

    const data = await fetchParsedAsset<FtnChartingRecord>(client, url, format);

    getLogger().debug(`Parsed ${data.length} FTN charting records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      getLogger().error(`Failed to load FTN charting data for season ${season}`, error);

      // Convert to appropriate error type
      if (error instanceof DataNotFoundError) {
        return Err(
          new DataNotFoundError(`FTN charting data not found for season ${season}`, {
            season,
            url,
          })
        );
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading FTN charting data for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading FTN charting data for season ${season}`));
  }
}
