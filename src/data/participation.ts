/**
 * Participation data loading functions
 * @module data/participation
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import type { Season } from '../types/common.js';
import { MIN_PARTICIPATION_SEASON } from '../types/constants.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  LoadParticipationOptions,
  ParticipationData,
  ParticipationRecord,
} from '../types/participation.js';

import { createLogger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildParticipationUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';

const logger = createLogger('loadParticipation');

// Participation data is available from 2016 onward

/**
 * Load participation data for one or more NFL seasons
 *
 * This function fetches player participation data from the nflverse data repository.
 * Participation data shows which players were on the field for each play, including
 * offensive and defensive formations, personnel groupings, and coverage schemes.
 *
 * **Data Attribution:**
 * - Pre-2023: NFL NextGenStats
 * - 2023+: FTN Data
 * - License: CC-BY-SA 4.0
 * - Required attribution: "FTN Data via nflverse" or "NFL NextGenStats via nflverse"
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2016-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of participation records or an error
 *
 * @example
 * ```typescript
 * // Load current season
 * const participation = await loadParticipation();
 *
 * // Load specific season
 * const part2023 = await loadParticipation(2023);
 *
 * // Load multiple seasons
 * const partMulti = await loadParticipation([2022, 2023]);
 *
 * // Load all available data (2016+)
 * const partAll = await loadParticipation(true);
 *
 * // Load with parquet format (faster, smaller file size)
 * const partParquet = await loadParticipation(2023, { format: 'parquet' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_participation.html | nflreadr::load_participation}
 */
export async function loadParticipation(
  seasons?: Season | Season[] | true,
  options: LoadParticipationOptions = {}
): Promise<Result<ParticipationData, Error>> {
  const { format = 'csv' } = options;

  try {
    // Determine which seasons to load (participation data available from 2016+)
    const seasonsToLoad = normalizeSeasons(seasons, { minSeason: MIN_PARTICIPATION_SEASON });

    logger.debug(`Loading participation data for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront (both general validation and participation-specific)
    for (const season of seasonsToLoad) {
      // General season validation (1999+)
      assertValidSeason(season);

      // Participation data only available from 2016 onward
      if (season < MIN_PARTICIPATION_SEASON) {
        const message = `Participation data is only available from ${MIN_PARTICIPATION_SEASON} onward. Requested season: ${season}`;
        throw new Error(message);
      }
    }

    // Create a single HttpClient instance for all requests
    const config = getConfig();
    const client = new HttpClient({
      timeout: config.http.timeout,
      retry: config.http.retries,
      cache: config.cache.enabled,
      cacheTtl: config.cache.ttl,
      debug: config.logging.debug,
    });

    // Load data for each season in parallel
    const results = await Promise.all(
      seasonsToLoad.map((season) => loadParticipationForSeason(season, format, client))
    );

    // Optimize array concatenation - collect all arrays first, then concat once
    const dataArrays: ParticipationData[] = [];
    for (const result of results) {
      if (result.ok) {
        dataArrays.push(result.value);
      } else {
        // If any season fails, return the error
        return result;
      }
    }

    // Single concatenation is much faster than repeated spread operations
    const allData =
      dataArrays.length === 1 ? dataArrays[0]! : ([] as ParticipationData).concat(...dataArrays);

    logger.debug(`Loaded ${allData.length} participation records`);

    return Ok(allData);
  } catch (error) {
    logger.error('Failed to load participation data', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load participation data for a single season
 */
async function loadParticipationForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<ParticipationData, Error>> {
  try {
    // Build URL for the season's data
    const url = buildParticipationUrl(season, format);

    logger.debug(`Fetching participation data from: ${url}`);

    // Fetch the data
    const response = await client.get(url);

    if (response.status !== 200) {
      return Err(
        new DataNotFoundError(`Participation data not found for season ${season}`, {
          season,
          url,
          status: response.status,
        })
      );
    }

    // Parse based on format
    let data: ParticipationData;
    if (format === 'parquet') {
      // Parse parquet data from ArrayBuffer
      const buffer = response.data as ArrayBuffer;
      data = await parseParquet<ParticipationRecord>(buffer);
    } else {
      // Parse CSV data from string
      const csvString =
        typeof response.data === 'string'
          ? response.data
          : new TextDecoder().decode(response.data as ArrayBuffer);
      const parseResult = parseCsv<ParticipationRecord>(csvString);
      data = parseResult.data;
    }

    logger.debug(`Parsed ${data.length} participation records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to load participation data for season ${season}`, error);

      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading participation data for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading participation data for season ${season}`));
  }
}
