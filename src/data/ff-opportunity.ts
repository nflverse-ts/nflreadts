/**
 * Load fantasy football expected points (ffopportunity) data
 * @module data/ff-opportunity
 */

import type { Season } from '../types/common.js';
import { MIN_FF_OPPORTUNITY_SEASON } from '../types/constants.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  FfOpportunityModelVersion,
  FfOpportunityRecord,
  FfOpportunityStatType,
  LoadFfOpportunityOptions,
} from '../types/ff-opportunity.js';
import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { assertOneOf } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('ffOpportunity'));

/**
 * ffverse/ffopportunity GitHub releases (not nflverse-data release assets).
 * File pattern verified against nflreadpy's `load_ff_opportunity`:
 * `{modelVersion}-data/ep_{statType}_{season}.{format}`.
 */
const FF_OPPORTUNITY_BASE_URL = 'https://github.com/ffverse/ffopportunity/releases/download';

const FF_OPPORTUNITY_STAT_TYPES: readonly FfOpportunityStatType[] = [
  'weekly',
  'pbp_pass',
  'pbp_rush',
];
const FF_OPPORTUNITY_MODEL_VERSIONS: readonly FfOpportunityModelVersion[] = ['latest', 'v1.0.0'];

/**
 * Load fantasy football expected points data
 *
 * Returns expected fantasy points and opportunity metrics from the
 * ffverse/ffopportunity project. Data is published per season as 'weekly'
 * player summaries or play-level 'pbp_pass'/'pbp_rush' files; one file is
 * fetched per requested season, in parallel.
 *
 * Data is available from 2006 onward.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - Single season number (e.g., 2023)
 *   - Array of seasons (e.g., [2022, 2023])
 *   - `true` to load ALL available seasons (2006-present)
 *   - Omit to load current season
 * @param options - Load options including stat type, model version, and format
 * @returns Result containing array of expected points records or an error
 *
 * @example
 * ```typescript
 * // Load current-season weekly expected points (defaults)
 * const result = await loadFfOpportunity();
 * if (result.ok) {
 *   const top = result.value
 *     .filter((row) => row.position === 'WR')
 *     .sort((a, b) => (b.total_fantasy_points_exp ?? 0) - (a.total_fantasy_points_exp ?? 0));
 *   console.log(top[0]?.full_name);
 * }
 *
 * // Load play-level passing expected points for 2023
 * const pbp = await loadFfOpportunity(2023, { statType: 'pbp_pass' });
 *
 * // Pin the v1.0.0 model outputs
 * const pinned = await loadFfOpportunity([2022, 2023], { modelVersion: 'v1.0.0' });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_opportunity.html
 */
export async function loadFfOpportunity(
  seasons?: Season | Season[] | true,
  options: LoadFfOpportunityOptions = {}
): Promise<Result<FfOpportunityRecord[], Error>> {
  const { statType = 'weekly', modelVersion = 'latest', format = 'csv' } = options;

  try {
    assertOneOf(statType, FF_OPPORTUNITY_STAT_TYPES, 'statType');
    assertOneOf(modelVersion, FF_OPPORTUNITY_MODEL_VERSIONS, 'modelVersion');

    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_FF_OPPORTUNITY_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    for (const season of seasonsToLoad) {
      if (
        !Number.isInteger(season) ||
        season < MIN_FF_OPPORTUNITY_SEASON ||
        season > currentSeason
      ) {
        throw new Error(
          `Expected points data is only available from ${MIN_FF_OPPORTUNITY_SEASON} to ${currentSeason}. Requested season: ${String(season)}`
        );
      }
    }

    getLogger().info(
      `Loading ffopportunity ${statType} (${modelVersion}) for seasons: ${seasonsToLoad.join(', ')}`
    );

    const client = createDataClient();

    // One file per season, fetched in parallel
    const perSeason = await Promise.all(
      seasonsToLoad.map((season) => {
        const url = `${FF_OPPORTUNITY_BASE_URL}/${modelVersion}-data/ep_${statType}_${season}.${format}`;
        getLogger().debug(`Fetching expected points from: ${url}`);
        return fetchParsedAsset<FfOpportunityRecord>(client, url, format);
      })
    );

    const allData = concatSeasons(perSeason);
    getLogger().info(`Loaded ${allData.length} expected points records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load ffopportunity data', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading ffopportunity data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
