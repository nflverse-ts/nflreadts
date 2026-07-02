/**
 * Load fantasy football player ID crosswalk data
 * @module data/ff-playerids
 */

import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import type { FfPlayeridsRecord } from '../types/ff-playerids.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('ffPlayerids'));

/**
 * DynastyProcess player ID database (not an nflverse-data release asset).
 * Published as CSV only, so there is no format option.
 * URL verified against nflreadpy's downloader
 * (`dynastyprocess` base + `db_playerids`, CSV format).
 */
const FF_PLAYERIDS_URL = 'https://github.com/dynastyprocess/data/raw/master/files/db_playerids.csv';

/**
 * Load fantasy football player IDs
 *
 * Returns the DynastyProcess.com player ID crosswalk, which maps each
 * player's identifiers across fantasy platforms and data providers (MFL,
 * Sleeper, ESPN, Yahoo, GSIS, PFR, FantasyPros, and more). The full database
 * is a single file with no season dimension.
 *
 * @returns Result containing array of player ID records or an error
 *
 * @example
 * ```typescript
 * const result = await loadFfPlayerids();
 * if (result.ok) {
 *   const ids = result.value;
 *   console.log(`Loaded ${ids.length} player ID mappings`);
 *
 *   // Find a player's Sleeper ID from their GSIS ID
 *   const mahomes = ids.find((row) => row.gsis_id === '00-0033873');
 *   console.log(mahomes?.sleeper_id);
 * } else {
 *   console.error('Error loading player IDs:', result.error);
 * }
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_playerids.html
 */
export async function loadFfPlayerids(): Promise<Result<FfPlayeridsRecord[], Error>> {
  try {
    getLogger().info('Loading fantasy football player IDs');
    getLogger().debug(`Fetching player IDs from: ${FF_PLAYERIDS_URL}`);

    const client = createDataClient();
    const data = await fetchParsedAsset<FfPlayeridsRecord>(client, FF_PLAYERIDS_URL, 'csv');

    getLogger().info(`Loaded ${data.length} player ID records`);

    return Ok(data);
  } catch (error) {
    getLogger().error('Failed to load fantasy football player IDs', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading fantasy football player IDs', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
