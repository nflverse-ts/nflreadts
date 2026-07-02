/**
 * Depth chart data loading functionality
 * @module data/depth-charts
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import type { Season } from '../types/common.js';
import { MIN_DEPTH_CHART_SEASON } from '../types/constants.js';
import type { DepthChartRecord, LoadDepthChartsOptions } from '../types/depth-chart.js';
import { Err, ErrorCode, NetworkError, Ok, type Result, ValidationError } from '../types/error.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildDepthChartsUrl } from '../utils/url.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('depth-charts'));

/**
 * Load NFL weekly depth charts
 *
 * Returns weekly depth chart information showing position rankings (starters, backups, etc.)
 * for all teams. Depth charts are published weekly during the season.
 *
 * Data is available from 2001 to the current season.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2001-present)
 *   - Undefined to load current season
 * @param options - Load options including format preference
 * @returns Result containing array of depth chart records or an error
 *
 * @example
 * ```typescript
 * // Load current season depth charts
 * const result = await loadDepthCharts();
 * if (result.ok) {
 *   const charts = result.value;
 *   console.log(`Loaded ${charts.length} depth chart entries`);
 *
 *   // Find starters for a specific team and week
 *   const kcStarters = charts.filter(d =>
 *     d.team === 'KC' && d.week === 1 && d.pos_rank === 1
 *   );
 * } else {
 *   console.error('Error loading depth charts:', result.error);
 * }
 *
 * // Load specific season
 * const result2023 = await loadDepthCharts(2023);
 * if (result2023.ok) {
 *   // Process depth charts...
 * }
 *
 * // Load multiple seasons
 * const multiResult = await loadDepthCharts([2022, 2023]);
 *
 * // Load all available seasons (2001-present)
 * const allResult = await loadDepthCharts(true);
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_depth_charts.html
 */
export async function loadDepthCharts(
  seasons?: Season | Season[] | true,
  options: LoadDepthChartsOptions = {}
): Promise<Result<DepthChartRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    const config = getConfig();
    const currentSeason = getCurrentSeason();

    // Normalize seasons
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_DEPTH_CHART_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().info(
      `Loading depth charts for ${seasonsToLoad.length} season(s): ${seasonsToLoad.join(', ')} (format: ${format})`
    );

    // Validate seasons
    for (const season of seasonsToLoad) {
      if (season < MIN_DEPTH_CHART_SEASON) {
        return Err(
          new ValidationError(
            `Season ${season} is before the minimum season (${MIN_DEPTH_CHART_SEASON}) for depth chart data`,
            ErrorCode.INVALID_SEASON,
            { season, minSeason: MIN_DEPTH_CHART_SEASON }
          )
        );
      }
      if (season > currentSeason) {
        return Err(
          new ValidationError(
            `Season ${season} is in the future (current season: ${currentSeason})`,
            ErrorCode.INVALID_SEASON,
            { season, currentSeason }
          )
        );
      }
    }

    const client = new HttpClient(config.http);

    // Build URLs for each season
    const urls = seasonsToLoad.map((season) => buildDepthChartsUrl(season, format));

    getLogger().debug(`Fetching from ${urls.length} URL(s)`);

    // Fetch all seasons in parallel
    const datasets: DepthChartRecord[][] = [];

    const fetchPromises = urls.map(async (url) => {
      const response = await client.get(url, loadOptions);

      // Parse based on format
      if (format === 'parquet') {
        const buffer = response.data as ArrayBuffer;
        return parseParquet<DepthChartRecord>(buffer);
      } else {
        const csvString =
          typeof response.data === 'string'
            ? response.data
            : new TextDecoder().decode(response.data as ArrayBuffer);
        const parseResult = parseCsv<DepthChartRecord>(csvString);
        return parseResult.data;
      }
    });

    const results = await Promise.all(fetchPromises);
    datasets.push(...results);

    getLogger().debug(`Received ${datasets.length} datasets`);

    // Concatenate all datasets efficiently
    const totalRows = datasets.reduce((sum, data) => sum + data.length, 0);
    const result: DepthChartRecord[] = new Array<DepthChartRecord>(totalRows);

    let offset = 0;
    for (const data of datasets) {
      for (let i = 0; i < data.length; i++) {
        result[offset + i] = data[i]!;
      }
      offset += data.length;
    }

    getLogger().info(`Loaded ${result.length} depth chart records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load depth charts', error);
    if (error instanceof Error) {
      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading depth chart data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
