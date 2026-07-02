/**
 * Injury report data loading functions
 * @module data/injuries
 */

import type { HttpClient } from '../client/client.js';
import type { Season } from '../types/common.js';
import { MIN_INJURY_SEASON } from '../types/constants.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { InjuryData, InjuryRecord, LoadInjuriesOptions } from '../types/injuries.js';

import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildInjuriesUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('loadInjuries'));

/**
 * Load injury reports for one or more NFL seasons
 *
 * This function fetches official injury report data from the nflverse data
 * repository (the `injuries` release). Each row is one player's entry on a
 * team's weekly injury report, including both the game status report
 * (Out/Doubtful/Questionable) and practice participation.
 *
 * Injury report data is available from 2009 onward.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2009-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of injury records or an error
 *
 * @example
 * ```typescript
 * // Load current season injury reports
 * const injuries = await loadInjuries();
 *
 * // Load specific season
 * const injuries2023 = await loadInjuries(2023);
 *
 * // Load multiple seasons
 * const injuriesMulti = await loadInjuries([2022, 2023]);
 *
 * // Load all available data (2009+)
 * const injuriesAll = await loadInjuries(true);
 *
 * // Parquet is the default; pass 'csv' if you need CSV
 * const injuriesCsv = await loadInjuries(2023, { format: 'csv' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_injuries.html | nflreadr::load_injuries}
 */
export async function loadInjuries(
  seasons?: Season | Season[] | true,
  options: LoadInjuriesOptions = {}
): Promise<Result<InjuryData, Error>> {
  const { format = 'parquet' } = options;

  try {
    // Determine which seasons to load (injury reports available from 2009 onward)
    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_INJURY_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().debug(`Loading injury reports for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront (both general and dataset-specific)
    for (const season of seasonsToLoad) {
      assertValidSeason(season);

      if (season < MIN_INJURY_SEASON) {
        throw new Error(
          `Injury report data is only available from ${MIN_INJURY_SEASON} onward. Requested season: ${season}`
        );
      }
    }

    const client = createDataClient();

    // Load data for each season in parallel
    const results = await Promise.all(
      seasonsToLoad.map((season) => loadInjuriesForSeason(season, format, client))
    );

    const dataArrays: InjuryData[] = [];
    for (const result of results) {
      if (result.ok) {
        dataArrays.push(result.value);
      } else {
        // If any season fails, return the error
        return result;
      }
    }

    const allData = concatSeasons(dataArrays);

    getLogger().debug(`Loaded ${allData.length} injury records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load injury reports', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load injury reports for a single season
 */
async function loadInjuriesForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<InjuryData, Error>> {
  const url = buildInjuriesUrl(season, format);

  try {
    getLogger().debug(`Fetching injury reports from: ${url}`);

    const data = await fetchParsedAsset<InjuryRecord>(client, url, format);

    getLogger().debug(`Parsed ${data.length} injury records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      getLogger().error(`Failed to load injury reports for season ${season}`, error);

      // Convert to appropriate error type
      if (error instanceof DataNotFoundError) {
        return Err(
          new DataNotFoundError(`Injury report data not found for season ${season}`, {
            season,
            url,
          })
        );
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading injury reports for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading injury reports for season ${season}`));
  }
}
