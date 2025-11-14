/**
 * Load schedule and game data
 * @module data/schedules
 */

import type { Season } from '../types/common.js';
import type { LoadSchedulesOptions, ScheduleRecord } from '../types/schedule.js';

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildScheduleUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { validateSeasons } from '../validation/index.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('schedules'));

/**
 * Load NFL game schedule data
 *
 * Returns game and schedule information for specified season(s). Data includes
 * game identifiers, team matchups, scores, betting lines, weather conditions,
 * and various game metadata. Data is maintained by Lee Sharpe.
 *
 * Schedule data is available from 1999 to the current season.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (1999-present)
 *   - Omit to load current season (or previous season if before March)
 * @param options - Load options including format and caching
 * @returns Result containing array of schedule records or an error
 *
 * @example
 * ```typescript
 * // Load current season schedule
 * const result = await loadSchedules();
 * if (result.ok) {
 *   const schedule = result.value;
 *   console.log(`Loaded ${schedule.length} games`);
 *
 *   // Filter for playoff games
 *   const playoffs = schedule.filter(game => game.game_type !== 'REG');
 *
 *   // Get games for a specific team
 *   const chiefs = schedule.filter(game =>
 *     game.home_team === 'KC' || game.away_team === 'KC'
 *   );
 * } else {
 *   console.error('Error loading schedule:', result.error);
 * }
 *
 * // Load specific season
 * const result2023 = await loadSchedules(2023);
 *
 * // Load multiple seasons
 * const multiResult = await loadSchedules([2022, 2023]);
 *
 * // Load all available seasons
 * const allResult = await loadSchedules(true);
 *
 * // Use Parquet format for better performance
 * const parquetResult = await loadSchedules(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_schedules.html
 */
export async function loadSchedules(
  seasons?: Season | Season[] | true,
  options: LoadSchedulesOptions = {}
): Promise<Result<ScheduleRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    // Validate format parameter
    assertValidFormat(format);

    // Determine which seasons to load
    const currentSeason = getCurrentSeason();
    const minSeason = 1999;

    // Normalize seasons input
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().info(`Loading schedules for seasons: ${seasonsToLoad.join(', ')}`);

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
    const urls = seasonsToLoad.map((season) => buildScheduleUrl(season, format));

    // Fetch all seasons in parallel
    const config = getConfig();
    const client = new HttpClient({
      timeout: config.http.timeout,
      retry: config.http.retries,
      cache: config.cache.enabled,
      cacheTtl: config.cache.ttl,
      debug: config.logging.debug,
    });
    const datasets: ScheduleRecord[][] = [];

    const fetchPromises = urls.map(async (url) => {
      getLogger().debug(`Fetching schedule data from: ${url}`);

      const response = await client.get(url, loadOptions);

      // Parse based on format
      if (format === 'parquet') {
        const buffer = response.data as ArrayBuffer;
        return parseParquet<ScheduleRecord>(buffer);
      } else {
        const csvString =
          typeof response.data === 'string'
            ? response.data
            : new TextDecoder().decode(response.data as ArrayBuffer);
        const parseResult = parseCsv<ScheduleRecord>(csvString);
        return parseResult.data;
      }
    });

    const results = await Promise.all(fetchPromises);
    datasets.push(...results);

    getLogger().debug(`Received ${datasets.length} datasets`);

    // Pre-allocate result array for better performance
    const totalRows = datasets.reduce((sum, data) => sum + data.length, 0);
    const result: ScheduleRecord[] = new Array<ScheduleRecord>(totalRows);

    // Concatenate all datasets efficiently
    let offset = 0;
    for (const data of datasets) {
      for (let i = 0; i < data.length; i++) {
        result[offset + i] = data[i]!;
      }
      offset += data.length;
    }

    getLogger().info(`Loaded ${result.length} schedule records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load schedules', error);
    if (error instanceof Error) {
      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading schedule data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
