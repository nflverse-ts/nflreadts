/**
 * Weekly roster data loading functions
 * @module data/rostersweekly
 */

import type { HttpClient } from '../client/client.js';
import type { Season } from '../types/common.js';
import { MIN_WEEKLY_ROSTER_SEASON } from '../types/constants.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  LoadRostersWeeklyOptions,
  WeeklyRosterData,
  WeeklyRosterRecord,
} from '../types/rosters-weekly.js';

import { getCurrentSeason } from '../utils/datetime.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildWeeklyRosterUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';
import { concatSeasons, createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('loadRostersWeekly'));

/**
 * Load weekly rosters for one or more NFL seasons
 *
 * This function fetches week-by-week roster data from the nflverse data
 * repository (the `weekly_rosters` release). Each row is one player on one
 * team's roster for a given week, so player movement, roster status changes,
 * and practice squad elevations are all visible over the course of a season.
 *
 * Weekly roster data is available from 2002 onward.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (2002-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of weekly roster records or an error
 *
 * @example
 * ```typescript
 * // Load current season weekly rosters
 * const rosters = await loadRostersWeekly();
 *
 * // Load specific season
 * const rosters2023 = await loadRostersWeekly(2023);
 *
 * // Load multiple seasons
 * const rostersMulti = await loadRostersWeekly([2022, 2023]);
 *
 * // Load all available data (2002+)
 * const rostersAll = await loadRostersWeekly(true);
 *
 * // Parquet is the default; pass 'csv' if you need CSV
 * const rostersCsv = await loadRostersWeekly(2023, { format: 'csv' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_rosters_weekly.html | nflreadr::load_rosters_weekly}
 */
export async function loadRostersWeekly(
  seasons?: Season | Season[] | true,
  options: LoadRostersWeeklyOptions = {}
): Promise<Result<WeeklyRosterData, Error>> {
  const { format = 'parquet' } = options;

  try {
    // Determine which seasons to load (weekly rosters available from 2002 onward)
    const currentSeason = getCurrentSeason();
    const seasonsToLoad = normalizeSeasons(seasons, {
      minSeason: MIN_WEEKLY_ROSTER_SEASON,
      maxSeason: currentSeason,
      defaultSeason: currentSeason,
    });

    getLogger().debug(`Loading weekly rosters for seasons: ${seasonsToLoad.join(', ')}`);

    // Validate all seasons upfront (both general and dataset-specific)
    for (const season of seasonsToLoad) {
      assertValidSeason(season);

      if (season < MIN_WEEKLY_ROSTER_SEASON) {
        throw new Error(
          `Weekly roster data is only available from ${MIN_WEEKLY_ROSTER_SEASON} onward. Requested season: ${season}`
        );
      }
    }

    const client = createDataClient();

    // Load data for each season in parallel
    const results = await Promise.all(
      seasonsToLoad.map((season) => loadRostersWeeklyForSeason(season, format, client))
    );

    const dataArrays: WeeklyRosterData[] = [];
    for (const result of results) {
      if (result.ok) {
        dataArrays.push(result.value);
      } else {
        // If any season fails, return the error
        return result;
      }
    }

    const allData = concatSeasons(dataArrays);

    getLogger().debug(`Loaded ${allData.length} weekly roster records`);

    return Ok(allData);
  } catch (error) {
    getLogger().error('Failed to load weekly rosters', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load weekly rosters for a single season
 */
async function loadRostersWeeklyForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  client: HttpClient
): Promise<Result<WeeklyRosterData, Error>> {
  const url = buildWeeklyRosterUrl(season, format);

  try {
    getLogger().debug(`Fetching weekly rosters from: ${url}`);

    const data = await fetchParsedAsset<WeeklyRosterRecord>(client, url, format);

    getLogger().debug(`Parsed ${data.length} weekly roster records for season ${season}`);

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      getLogger().error(`Failed to load weekly rosters for season ${season}`, error);

      // Convert to appropriate error type
      if (error instanceof DataNotFoundError) {
        return Err(
          new DataNotFoundError(`Weekly roster data not found for season ${season}`, {
            season,
            url,
          })
        );
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading weekly rosters for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading weekly rosters for season ${season}`));
  }
}
