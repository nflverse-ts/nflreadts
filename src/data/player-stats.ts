/**
 * Player stats data loading functions
 * @module data/playerstats
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import type { Season } from '../types/common.js';
import { DataNotFoundError, Err, NetworkError, Ok, type Result } from '../types/error.js';
import type {
  LoadPlayerStatsOptions,
  PlayerStatsData,
  PlayerStatsRecord,
  SummaryLevel,
} from '../types/player-stats.js';

import { createLogger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { normalizeSeasons } from '../utils/seasons.js';
import { buildPlayerStatsUrl } from '../utils/url.js';
import { assertValidSeason } from '../utils/validation.js';

const logger = createLogger('loadPlayerStats');

/**
 * Load player statistics for one or more NFL seasons
 *
 * This function fetches player statistics from the nflverse data repository.
 * The data includes comprehensive player performance metrics that aim to match
 * NFL official box scores and season summaries, covering passing, rushing,
 * receiving, defensive, kicking, and special teams statistics.
 *
 * @param seasons - Season(s) to load. Can be:
 *   - A single season number (e.g., 2023)
 *   - An array of seasons (e.g., [2022, 2023])
 *   - `true` to load all available seasons (1999-present)
 *   - `undefined` to load the current season
 * @param options - Additional options for loading data
 * @returns Result containing array of player stats records or an error
 *
 * @example
 * ```typescript
 * // Load current season weekly stats
 * const stats = await loadPlayerStats();
 *
 * // Load specific season
 * const stats2023 = await loadPlayerStats(2023);
 *
 * // Load multiple seasons
 * const statsMulti = await loadPlayerStats([2022, 2023]);
 *
 * // Load regular season totals
 * const regStats = await loadPlayerStats(2023, { summaryLevel: 'reg' });
 *
 * // Load postseason totals
 * const postStats = await loadPlayerStats(2023, { summaryLevel: 'post' });
 *
 * // Load combined regular + postseason totals
 * const fullStats = await loadPlayerStats(2023, { summaryLevel: 'reg+post' });
 *
 * // Load with parquet format (faster, smaller file size)
 * const statsParquet = await loadPlayerStats(2023, { format: 'parquet' });
 * ```
 *
 * @see {@link https://nflreadr.nflverse.com/reference/load_player_stats.html | nflreadr::load_player_stats}
 */
export async function loadPlayerStats(
  seasons?: Season | Season[] | true,
  options: LoadPlayerStatsOptions = {}
): Promise<Result<PlayerStatsData, Error>> {
  const { format = 'csv', summaryLevel = 'week' } = options;

  try {
    // Determine which seasons to load
    const seasonsToLoad = normalizeSeasons(seasons);

    logger.debug(
      `Loading player stats for seasons: ${seasonsToLoad.join(', ')}, level: ${summaryLevel}`
    );

    // Validate all seasons upfront
    for (const season of seasonsToLoad) {
      assertValidSeason(season);
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
      seasonsToLoad.map((season) => loadPlayerStatsForSeason(season, format, summaryLevel, client))
    );

    // Optimize array concatenation - collect all arrays first, then concat once
    const dataArrays: PlayerStatsData[] = [];
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
      dataArrays.length === 1 ? dataArrays[0]! : ([] as PlayerStatsData).concat(...dataArrays);

    logger.debug(`Loaded ${allData.length} player stats records`);

    return Ok(allData);
  } catch (error) {
    logger.error('Failed to load player stats', error);
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Load player stats for a single season
 */
async function loadPlayerStatsForSeason(
  season: Season,
  format: 'csv' | 'parquet',
  summaryLevel: SummaryLevel,
  client: HttpClient
): Promise<Result<PlayerStatsData, Error>> {
  try {
    // Build URL for the season's data
    // Note: summaryLevel affects which file we fetch
    const url = buildPlayerStatsUrl(season, format);

    logger.debug(`Fetching player stats from: ${url}`);

    // Fetch the data
    const response = await client.get(url);

    if (response.status !== 200) {
      return Err(
        new DataNotFoundError(`Player stats not found for season ${season}`, {
          season,
          url,
          status: response.status,
          summaryLevel,
        })
      );
    }

    // Parse based on format
    let data: PlayerStatsData;
    if (format === 'parquet') {
      // Parse parquet data from ArrayBuffer
      const buffer = response.data as ArrayBuffer;
      data = await parseParquet<PlayerStatsRecord>(buffer);
    } else {
      // Parse CSV data from string
      const csvString =
        typeof response.data === 'string'
          ? response.data
          : new TextDecoder().decode(response.data as ArrayBuffer);
      const parseResult = parseCsv<PlayerStatsRecord>(csvString);
      data = parseResult.data;
    }

    // Apply summary level filtering/aggregation
    data = applySummaryLevel(data, summaryLevel);

    logger.debug(
      `Parsed ${data.length} player stats records for season ${season} (level: ${summaryLevel})`
    );

    return Ok(data);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to load player stats for season ${season}`, error);

      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError(`Network error loading player stats for season ${season}`, {
            season,
            originalError: error.message,
          })
        );
      }

      return Err(error);
    }

    return Err(new Error(`Unknown error loading player stats for season ${season}`));
  }
}

/**
 * Apply summary level filtering/aggregation to player stats data
 * - 'week': Return all weekly data (no change)
 * - 'reg': Filter to regular season only, aggregate by player
 * - 'post': Filter to postseason only, aggregate by player
 * - 'reg+post': Aggregate all weeks by player
 */
function applySummaryLevel(data: PlayerStatsData, summaryLevel: SummaryLevel): PlayerStatsData {
  // If week level, return data as-is
  if (summaryLevel === 'week') {
    return data;
  }

  // Filter based on summary level
  let filteredData = data;
  if (summaryLevel === 'reg') {
    // Regular season: weeks 1-18
    filteredData = data.filter((record) => {
      const week = record.week;
      return week !== null && week >= 1 && week <= 18;
    });
  } else if (summaryLevel === 'post') {
    // Postseason: weeks 19+
    filteredData = data.filter((record) => {
      const week = record.week;
      return week !== null && week >= 19;
    });
  }
  // For 'reg+post', we use all data (no filter)

  // Aggregate by player
  return aggregatePlayerStats(filteredData);
}

/**
 * List of numeric fields to aggregate when summing player stats
 * Defined at module level for reuse across aggregation calls
 */
const AGGREGATABLE_FIELDS = [
  // Passing stats
  'completions',
  'attempts',
  'passing_yards',
  'passing_tds',
  'interceptions',
  'sacks',
  'sack_yards',
  'sack_fumbles',
  'sack_fumbles_lost',
  'passing_air_yards',
  'passing_yards_after_catch',
  'passing_first_downs',
  'passing_epa',
  'passing_2pt_conversions',
  'pacr',
  'dakota',
  // Rushing stats
  'carries',
  'rushing_yards',
  'rushing_tds',
  'rushing_fumbles',
  'rushing_fumbles_lost',
  'rushing_first_downs',
  'rushing_epa',
  'rushing_2pt_conversions',
  // Receiving stats
  'receptions',
  'targets',
  'receiving_yards',
  'receiving_tds',
  'receiving_air_yards',
  'receiving_yards_after_catch',
  'receiving_epa',
  'receiving_fumbles',
  'receiving_fumbles_lost',
  'receiving_first_downs',
  'receiving_2pt_conversions',
  // Defensive stats
  'def_tackles_solo',
  'def_tackles_with_assist',
  'def_tackles_combined',
  'def_tackles_for_loss',
  'def_sacks',
  'def_qb_hits',
  'def_interceptions',
  'def_interception_yards',
  'def_interception_tds',
  'def_pass_defended',
  'def_fumbles_forced',
  'def_fumble_recoveries',
  'def_fumble_recovery_yards',
  'def_fumble_recovery_tds',
  'def_safeties',
  // Kicking stats
  'fg_made',
  'fg_att',
  'fg_missed',
  'fg_blocked',
  'fg_made_0_19',
  'fg_made_20_29',
  'fg_made_30_39',
  'fg_made_40_49',
  'fg_made_50_59',
  'fg_made_60_plus',
  'pat_made',
  'pat_att',
  'pat_missed',
  'pat_blocked',
  // Fantasy stats
  'fantasy_points',
  'fantasy_points_ppr',
  // Special teams
  'special_teams_tds',
] as const;

/**
 * Aggregate player stats by summing numeric fields for each player
 * Groups by player_id and sums all numeric stat fields
 */
function aggregatePlayerStats(data: PlayerStatsData): PlayerStatsData {
  if (data.length === 0) {
    return data;
  }

  // Single-pass aggregation: group and sum simultaneously
  const playerMap = new Map<string, PlayerStatsRecord>();

  for (const record of data) {
    const playerId = record.player_id;
    let aggregated = playerMap.get(playerId);

    if (!aggregated) {
      // First record for this player - clone and reset week
      // Spread preserves all numeric fields (including 0s and nulls)
      aggregated = {
        ...record,
        week: null, // Aggregated stats have no week
      };
      playerMap.set(playerId, aggregated);
    } else {
      // Aggregate all numeric stat fields using loop for DRY code
      for (const field of AGGREGATABLE_FIELDS) {
        const aggValue = aggregated[field] as number | null | undefined;
        const recValue = record[field] as number | null | undefined;
        (aggregated as Record<string, number | null | undefined>)[field] =
          (aggValue ?? 0) + (recValue ?? 0);
      }
    }
  }

  // Convert map to array and calculate derived fields
  const aggregated: PlayerStatsData = [];
  for (const record of playerMap.values()) {
    // Calculate derived percentage fields
    if (record.fg_att && record.fg_att > 0) {
      record.fg_pct = (record.fg_made ?? 0) / record.fg_att;
    }

    aggregated.push(record);
  }

  return aggregated;
}
