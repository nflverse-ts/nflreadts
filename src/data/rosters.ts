/**
 * Load roster data
 * @module data/rosters
 */

import type { Season } from '../types/common.js';
import type { LoadRostersOptions, RosterRecord } from '../types/roster.js';

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildRosterUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('rosters'));

/**
 * Load season-level NFL roster data
 *
 * Returns roster information for specified season(s). Data includes player
 * biographical information, team assignments, positions, and various player IDs
 * across different data sources.
 *
 * Data is available from 1920 to the current season.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (1920-present) - use with caution!
 *   - Omit to load current season (or previous season if before March)
 * @param options - Load options including format and caching
 * @returns Result containing array of roster records or an error
 *
 * @example
 * ```typescript
 * // Load current season roster
 * const result = await loadRosters();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} roster entries`);
 * } else {
 *   console.error('Error loading rosters:', result.error);
 * }
 *
 * // Load specific season with error handling
 * const result2023 = await loadRosters(2023);
 * if (result2023.ok) {
 *   const rosters = result2023.value;
 *   // Process rosters...
 * }
 *
 * // Load multiple seasons
 * const multiResult = await loadRosters([2022, 2023]);
 * if (multiResult.ok) {
 *   console.log(`Loaded ${multiResult.value.length} total roster entries`);
 * }
 *
 * // Load all seasons (careful - this is a LOT of data!)
 * const allResult = await loadRosters(true);
 *
 * // Parquet is the default; pass 'csv' if you need CSV
 * const csvResult = await loadRosters(2023, { format: 'csv' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_rosters.html
 */
export async function loadRosters(
  seasons?: Season | Season[] | true,
  options: LoadRostersOptions = {}
): Promise<Result<RosterRecord[], Error>> {
  const { format = 'parquet', ...loadOptions } = options;

  try {
    // Validate format parameter
    assertValidFormat(format);

    // Determine which seasons to load
    const currentSeason = getCurrentSeason();
    const minSeason = 1920;

    // Normalize seasons input
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().info(`Loading rosters for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons using centralized validation
    const validationResult = validateSeasons(seasonsToLoad, {
      minSeason,
      maxSeason: currentSeason,
      allowFuture: false,
      coerce: false,
    });

    if (!validationResult.valid) {
      return Err(validationResult.error!);
    }

    // Build URLs for all seasons
    const urls = seasonsToLoad.map((season) => buildRosterUrl(season, format));

    // Fetch all seasons in parallel
    const config = getConfig();
    const client = new HttpClient({
      timeout: config.http.timeout,
      retry: config.http.retries,
      cache: config.cache.enabled,
      cacheTtl: config.cache.ttl,
      debug: config.logging.debug,
    });
    const datasets: RosterRecord[][] = [];

    const fetchPromises = urls.map(async (url) => {
      getLogger().debug(`Fetching roster data from: ${url}`);

      const response = await client.get(url, loadOptions);

      // Parse based on format
      if (format === 'parquet') {
        const buffer = response.data as ArrayBuffer;
        return parseParquet<RosterRecord>(buffer);
      } else {
        const csvString =
          typeof response.data === 'string'
            ? response.data
            : new TextDecoder().decode(response.data as ArrayBuffer);
        const parseResult = parseCsv<RosterRecord>(csvString);
        return parseResult.data;
      }
    });

    const results = await Promise.all(fetchPromises);
    datasets.push(...results);

    getLogger().debug(`Received ${datasets.length} datasets`);

    // Pre-allocate result array for better performance
    const totalRows = datasets.reduce((sum, data) => sum + data.length, 0);
    const result: RosterRecord[] = new Array<RosterRecord>(totalRows);

    // Concatenate all datasets efficiently
    let offset = 0;
    for (const data of datasets) {
      for (let i = 0; i < data.length; i++) {
        result[offset + i] = data[i]!;
      }
      offset += data.length;
    }

    getLogger().info(`Loaded ${result.length} roster records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load rosters', error);
    if (error instanceof Error) {
      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading roster data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
