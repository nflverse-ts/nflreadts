/**
 * Play-by-play data loading functions
 * @module data/pbp
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import type { Season } from '../types/common.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { LoadPbpOptions, PlayByPlayData, PlayByPlayRecord } from '../types/pbp.js';
import {
  assertValidSeason,
  buildPbpUrl,
  createLogger,
  getCurrentSeason,
  parseCsv,
  parseParquet,
} from '../utils';

const logger = createLogger('loadPbp');

/**
 * Load play-by-play data for one or more NFL seasons
 *
 * This function fetches nflfastR play-by-play data from the nflverse data repository.
 * The data includes detailed information about every play in NFL games, including
 * game identifiers, play descriptions, Expected Points Added (EPA), Win Probability
 * Added (WPA), and much more.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (1999-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of play-by-play records or an error
 *
 * @example
 * ```typescript
 * // Load current season
 * const pbp = await loadPbp();
 *
 * // Load specific season
 * const pbp2023 = await loadPbp(2023);
 *
 * // Load multiple seasons
 * const pbpMulti = await loadPbp([2022, 2023]);
 *
 * // Load all available data
 * const pbpAll = await loadPbp(true);
 *
 * // Load with parquet format (faster, smaller file size)
 * const pbpParquet = await loadPbp(2023, { format: 'parquet' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_pbp.html | nflreadr::load_pbp}
 * @see {@link https://www.nflfastr.com/articles/beginners_guide.html | nflfastR Beginner's Guide}
 */
export async function loadPbp(
  seasons?: Season | Season[] | true,
  options: LoadPbpOptions = {}
): Promise<Result<PlayByPlayData, Error>> {
  const { format = 'csv' } = options;

  try {
    // Determine which seasons to load
    const seasonsToLoad = normalizeSeasons(seasons);

    logger.debug(`Loading PBP data for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront
    for (const season of seasonsToLoad) {
      assertValidSeason(season);
    }

    // Create a single HttpClient instance for all requests
    // This allows connection pooling and cache sharing
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
      seasonsToLoad.map((season) => loadPbpForSeason(season, format, client))
    );

    // Optimize array concatenation - collect all arrays first, then concat once
    // This avoids repeated array copying (O(n) instead of O(n²))
    const dataArrays: PlayByPlayData[] = [];
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
      dataArrays.length === 1 ? dataArrays[0]! : ([] as PlayByPlayData).concat(...dataArrays);

    logger.debug(`Loaded ${allData.length} play-by-play records`);

    return Ok(allData);
  } catch (error) {
    logger.error('Failed to load PBP data', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Normalize seasons parameter into array of season numbers
 * Uses optimized array generation for better performance
 */
function normalizeSeasons(seasons?: Season | Season[] | true): Season[] {
  // If undefined, use current season
  if (seasons === undefined) {
    return [getCurrentSeason()];
  }

  // If true, return all available seasons (1999-present)
  if (seasons === true) {
    const currentSeason = getCurrentSeason();
    const yearCount = currentSeason - 1999 + 1;
    // Pre-allocate array with known size for better performance
    const allSeasons: Season[] = new Array<number>(yearCount);
    for (let i = 0; i < yearCount; i++) {
      allSeasons[i] = 1999 + i;
    }
    return allSeasons;
  }

  // If array, return as-is
  if (Array.isArray(seasons)) {
    return seasons;
  }

  // If single season, wrap in array
  return [seasons];
}

/**
 * Load play-by-play data for a single season
 * Now accepts a pre-configured HttpClient for better performance
 */
async function loadPbpForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<PlayByPlayData, Error>> {
  try {
    // Build URL for the season's data
    const url = buildPbpUrl(season, format);

    logger.debug(`Fetching PBP data from: ${url}`);

    // Fetch the data
    const response = await client.get(url);

    if (response.status !== 200) {
      return Err(
        new DataNotFoundError(`Play-by-play data not found for season ${season}`, {
          season,
          url,
          status: response.status,
        })
      );
    }

    // Parse based on format
    let data: PlayByPlayData;
    if (format === 'parquet') {
      // Parse parquet data from ArrayBuffer
      const buffer = response.data as ArrayBuffer;
      data = await parseParquet<PlayByPlayRecord>(buffer);
    } else {
      // Parse CSV data from string
      // Optimize: avoid conditional check by using TextDecoder only when needed
      const csvString =
        typeof response.data === 'string'
          ? response.data
          : new TextDecoder().decode(response.data as ArrayBuffer);
      const parseResult = parseCsv<PlayByPlayRecord>(csvString);
      data = parseResult.data;
    }

    logger.debug(`Parsed ${data.length} records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to load PBP for season ${season}`, error);

      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading play-by-play data for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading play-by-play data for season ${season}`));
  }
}
