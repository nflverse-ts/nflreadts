/**
 * Load Pro Football Reference advanced stats
 * @module data/pfr-advstats
 */

import type { Season } from '../types/common.js';
import { MIN_PFR_ADVSTATS_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { LoadPfrAdvstatsOptions, PfrAdvstatsRecord } from '../types/pfr-advstats.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildPfrAdvstatsUrl, type PfrStatType, type PfrSummaryLevel } from '../utils/url.js';
import { assertOneOf } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('pfrAdvstats'));

const PFR_STAT_TYPES: readonly PfrStatType[] = ['pass', 'rush', 'rec', 'def'];
const PFR_SUMMARY_LEVELS: readonly PfrSummaryLevel[] = ['week', 'season'];

/**
 * Load Pro Football Reference advanced stats
 *
 * Returns advanced passing, rushing, receiving, or defensive statistics
 * scraped from Pro Football Reference. Week-level data is one file per stat
 * type per season (fetched in parallel); season-level data is a single
 * all-seasons file per stat type, filtered to the requested seasons.
 *
 * Columns differ between stat types and summary levels; see
 * {@link PfrAdvstatsRecord} for details.
 *
 * Data is available from 2018 onward.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2018-present)
 *   - Omit to load current season
 * @param options - Load options including stat type, summary level, and format
 * @returns Result containing array of PFR advanced stats records or an error
 *
 * @example
 * ```typescript
 * // Load current-season weekly passing stats (defaults)
 * const result = await loadPfrAdvstats();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} records`);
 * }
 *
 * // Load 2023 weekly defensive stats
 * const def = await loadPfrAdvstats(2023, { statType: 'def' });
 *
 * // Load season-level receiving stats for multiple seasons
 * const rec = await loadPfrAdvstats([2022, 2023], {
 *   statType: 'rec',
 *   summaryLevel: 'season',
 * });
 *
 * // Use parquet format
 * const parquet = await loadPfrAdvstats(2023, { format: 'parquet' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_pfr_advstats.html
 */
export async function loadPfrAdvstats(
  seasons?: Season | Season[] | true,
  options: LoadPfrAdvstatsOptions = {}
): Promise<Result<PfrAdvstatsRecord[], Error>> {
  const { statType = 'pass', summaryLevel = 'week', format = 'csv' } = options;

  try {
    assertOneOf(statType, PFR_STAT_TYPES, 'statType');
    assertOneOf(summaryLevel, PFR_SUMMARY_LEVELS, 'summaryLevel');

    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_PFR_ADVSTATS_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    for (const season of seasonsToLoad) {
      if (!Number.isInteger(season) || season < MIN_PFR_ADVSTATS_SEASON || season > currentSeason) {
        throw new Error(
          `PFR advanced stats are only available from ${MIN_PFR_ADVSTATS_SEASON} to ${currentSeason}. Requested season: ${String(season)}`
        );
      }
    }

    getLogger().info(
      `Loading PFR ${statType} advstats (${summaryLevel}) for seasons: ${seasonsToLoad.join(', ')}`
    );

    const client = createDataClient();

    if (summaryLevel === 'season') {
      // Single all-seasons file per stat type; fetch once and filter
      const url = buildPfrAdvstatsUrl(statType, 'season', undefined, format);
      getLogger().debug(`Fetching PFR advstats from: ${url}`);

      const allRecords = await fetchParsedAsset<PfrAdvstatsRecord>(client, url, format);
      const result =
        seasons === true
          ? allRecords
          : allRecords.filter((record) => seasonsToLoad.includes(record.season));

      getLogger().info(`Loaded ${result.length} PFR advstats records`);
      return Ok(result);
    }

    // Week level: one file per season, fetched in parallel
    const perSeason = await Promise.all(
      seasonsToLoad.map((season) => {
        const url = buildPfrAdvstatsUrl(statType, 'week', season, format);
        getLogger().debug(`Fetching PFR advstats from: ${url}`);
        return fetchParsedAsset<PfrAdvstatsRecord>(client, url, format);
      })
    );

    const allData = concatSeasons(perSeason);
    getLogger().info(`Loaded ${allData.length} PFR advstats records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load PFR advanced stats', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading PFR advanced stats data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
