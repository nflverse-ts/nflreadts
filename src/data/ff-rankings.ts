/**
 * Load fantasy football rankings data
 * @module data/ff-rankings
 */

import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { FfRankingsRecord, FfRankingsType } from '../types/ff-rankings.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { assertOneOf } from '../utils/validation.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('ffRankings'));

/**
 * DynastyProcess rankings files (not nflverse-data release assets).
 * File names verified against nflreadpy's `load_ff_rankings` mapping.
 * Each file exists in exactly one format ('draft'/'week' are CSV only,
 * 'all' is parquet only), so the format is fixed per type.
 */
const DYNASTYPROCESS_BASE_URL = 'https://github.com/dynastyprocess/data/raw/master/files';

const FF_RANKINGS_TYPES: readonly FfRankingsType[] = ['draft', 'week', 'all'];

const FF_RANKINGS_FILES: Record<FfRankingsType, { fileName: string; format: 'csv' | 'parquet' }> = {
  draft: { fileName: 'db_fpecr_latest', format: 'csv' },
  week: { fileName: 'fp_latest_weekly', format: 'csv' },
  all: { fileName: 'db_fpecr', format: 'parquet' },
};

/**
 * Load fantasy football rankings
 *
 * Returns FantasyPros expert consensus rankings archived by
 * DynastyProcess.com. Three datasets are available:
 * - 'draft' (default): the latest draft rankings scrape
 * - 'week': the latest weekly rankings scrape
 * - 'all': the full historical ECR database
 *
 * Columns vary by type; see {@link FfRankingsRecord} for details.
 *
 * @param type - Ranking dataset to load ('draft', 'week', or 'all')
 * @returns Result containing array of rankings records or an error
 *
 * @example
 * ```typescript
 * // Load latest draft rankings (default)
 * const result = await loadFfRankings();
 * if (result.ok) {
 *   const qbs = result.value.filter((row) => row.pos === 'QB');
 *   console.log(`Loaded ${qbs.length} QB rankings`);
 * }
 *
 * // Load latest weekly rankings
 * const weekly = await loadFfRankings('week');
 *
 * // Load full ranking history (large parquet file)
 * const history = await loadFfRankings('all');
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_rankings.html
 */
export async function loadFfRankings(
  type: FfRankingsType = 'draft'
): Promise<Result<FfRankingsRecord[], Error>> {
  try {
    assertOneOf(type, FF_RANKINGS_TYPES, 'type');

    const { fileName, format } = FF_RANKINGS_FILES[type];
    const url = `${DYNASTYPROCESS_BASE_URL}/${fileName}.${format}`;

    getLogger().info(`Loading '${type}' fantasy football rankings`);
    getLogger().debug(`Fetching rankings from: ${url}`);

    const client = createDataClient();
    const data = await fetchParsedAsset<FfRankingsRecord>(client, url, format);

    getLogger().info(`Loaded ${data.length} rankings records`);

    return Ok(data);
  } catch (error) {
    getLogger().error('Failed to load fantasy football rankings', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading fantasy football rankings', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
