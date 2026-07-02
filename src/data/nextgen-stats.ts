/**
 * Load NFL Next Gen Stats data
 * @module data/nextgen-stats
 */

import type { Season } from '../types/common.js';
import { MIN_NEXTGEN_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { LoadNextgenStatsOptions, NextgenStatsRecord } from '../types/nextgen-stats.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildNextGenStatsUrl, type NgsStatType } from '../utils/url.js';
import { assertOneOf } from '../utils/validation.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('nextgenStats'));

const NGS_STAT_TYPES: readonly NgsStatType[] = ['passing', 'receiving', 'rushing'];

/**
 * Load NFL Next Gen Stats data
 *
 * Returns weekly player-tracking metrics from NFL Next Gen Stats for the
 * requested stat category. Each stat type lives in a single file covering
 * 2016 to present, so this fetches once and filters to the requested seasons.
 *
 * Note: the weekly files include `week: 0` rows, which are each player's
 * season-aggregate totals; filter `week > 0` for true weekly rows only.
 *
 * Next Gen Stats are published as parquet only (no plain `.csv` release
 * asset exists), so there is no format option.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2016-present)
 *   - Omit to load all available seasons
 * @param options - Load options including stat type
 * @returns Result containing array of Next Gen Stats records or an error
 *
 * @example
 * ```typescript
 * // Load all passing seasons (default)
 * const result = await loadNextgenStats();
 * if (result.ok) {
 *   const weekly = result.value.filter((row) => row.week > 0);
 *   console.log(`Loaded ${weekly.length} weekly passing records`);
 * }
 *
 * // Load 2023 receiving stats
 * const receiving = await loadNextgenStats(2023, { statType: 'receiving' });
 *
 * // Load multiple seasons of rushing stats
 * const rushing = await loadNextgenStats([2022, 2023], { statType: 'rushing' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_nextgen_stats.html
 */
export async function loadNextgenStats(
  seasons?: Season | Season[] | true,
  options: LoadNextgenStatsOptions = {}
): Promise<Result<NextgenStatsRecord[], Error>> {
  const { statType = 'passing' } = options;

  try {
    assertOneOf(statType, NGS_STAT_TYPES, 'statType');

    const currentSeason = getCurrentSeason();
    const loadAll = seasons === undefined || seasons === true;
    const seasonsToLoad = normalizeSeasons(loadAll ? true : seasons, {
      minSeason: MIN_NEXTGEN_SEASON,
      maxSeason: currentSeason,
    });

    for (const season of seasonsToLoad) {
      if (!Number.isInteger(season) || season < MIN_NEXTGEN_SEASON || season > currentSeason) {
        throw new Error(
          `Next Gen Stats are only available from ${MIN_NEXTGEN_SEASON} to ${currentSeason}. Requested season: ${String(season)}`
        );
      }
    }

    getLogger().info(`Loading ${statType} Next Gen Stats for seasons: ${seasonsToLoad.join(', ')}`);

    // Single all-seasons file per stat type; fetch once and filter
    const url = buildNextGenStatsUrl(statType, 'parquet');
    getLogger().debug(`Fetching Next Gen Stats from: ${url}`);

    const client = createDataClient();
    const allRecords = await fetchParsedAsset<NextgenStatsRecord>(client, url, 'parquet');

    const result = loadAll
      ? allRecords
      : allRecords.filter((record) => seasonsToLoad.includes(record.season));

    getLogger().info(`Loaded ${result.length} Next Gen Stats records`);

    return Ok(result);
  } catch (error) {
    getLogger().error('Failed to load Next Gen Stats', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading Next Gen Stats data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
