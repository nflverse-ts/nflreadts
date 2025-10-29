/**
 * Load roster data
 * @module data/rosters
 */

import type { Season } from '../types/common.js';
import type { LoadRostersOptions, RosterRecord } from '../types/roster.js';

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import { ErrorCode, ValidationError } from '../types/error.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildRosterUrl } from '../utils/url.js';

const logger = createLogger('rosters');

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
 * @returns Promise resolving to array of roster records
 *
 * @example
 * ```typescript
 * // Load current season roster
 * const rosters = await loadRosters();
 *
 * // Load specific season
 * const rosters2023 = await loadRosters(2023);
 *
 * // Load multiple seasons
 * const rosters = await loadRosters([2022, 2023]);
 *
 * // Load all seasons (careful - this is a LOT of data!)
 * const allRosters = await loadRosters(true);
 *
 * // Use Parquet format for better performance
 * const rosters = await loadRosters(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_rosters.html
 */
export async function loadRosters(
  seasons?: Season | Season[] | true,
  options: LoadRostersOptions = {}
): Promise<RosterRecord[]> {
  const { format = 'csv', ...loadOptions } = options;

  // Determine which seasons to load
  const currentSeason = getCurrentSeason();
  const minSeason = 1920;

  // Normalize seasons input
  const seasonsToLoad = normalizeSeasons(seasons, {
    minSeason,
    maxSeason: currentSeason,
    defaultSeason: currentSeason,
  });

  logger.info(`Loading rosters for seasons: ${seasonsToLoad.join(', ')}`);

  // Validate seasons
  for (const season of seasonsToLoad) {
    if (season < minSeason) {
      throw new ValidationError(
        `Season ${season} is before the minimum season (${minSeason})`,
        ErrorCode.INVALID_SEASON,
        {
          season,
          minSeason,
        }
      );
    }
    if (season > currentSeason) {
      throw new ValidationError(`Season ${season} is in the future`, ErrorCode.INVALID_SEASON, {
        season,
        currentSeason,
      });
    }
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
    logger.debug(`Fetching roster data from: ${url}`);

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

  logger.debug(`Received ${datasets.length} datasets`);

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

  logger.info(`Loaded ${result.length} roster records`);

  return result;
}
