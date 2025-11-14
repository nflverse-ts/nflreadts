/**
 * Player data loading functionality
 * @module data/players
 */

import { HttpClient } from '../client/client.js';
import type { LoadPlayersOptions, PlayerRecord } from '../types';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { buildPlayersUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('players'));

/**
 * Load all-time player database
 *
 * Returns comprehensive player information including all player IDs across different systems
 * (ESPN, PFF, PFR, OTC, etc.), biographical data, and draft information.
 *
 * The player database is maintained across all NFL history and includes players from
 * multiple sources with cross-referenced IDs.
 *
 * @param options - Load options including format preference
 * @returns Result containing array of player records or an error
 *
 * @example
 * ```typescript
 * // Load all players (CSV format)
 * const result = await loadPlayers();
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.length} players`);
 *
 *   // Find a specific player
 *   const mahomes = result.value.find(p => p.display_name === 'Patrick Mahomes');
 *   console.log(mahomes?.gsis_id); // '00-0033873'
 * } else {
 *   console.error('Error loading players:', result.error);
 * }
 *
 * // Load using Parquet format for better performance
 * const parquetResult = await loadPlayers({ format: 'parquet' });
 * if (parquetResult.ok) {
 *   const players = parquetResult.value;
 *   // Process players...
 * }
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_players.html
 */
export async function loadPlayers(
  options: LoadPlayersOptions = {}
): Promise<Result<PlayerRecord[], Error>> {
  const { format = 'csv', ...loadOptions } = options;

  try {
    // Validate format parameter
    assertValidFormat(format);

    getLogger().info(`Loading players data (format: ${format})`);

    const client = new HttpClient();

    // Build URL for the format
    const url = buildPlayersUrl(format);

    getLogger().debug(`Fetching from: ${url}`);

    // Fetch the data
    const response = await client.get(url, loadOptions);

    // Parse based on format
    let data: PlayerRecord[];

    if (format === 'parquet') {
      const buffer = response.data as ArrayBuffer;
      data = await parseParquet<PlayerRecord>(buffer);
    } else {
      const csvString =
        typeof response.data === 'string'
          ? response.data
          : new TextDecoder().decode(response.data as ArrayBuffer);
      const parseResult = parseCsv<PlayerRecord>(csvString);
      data = parseResult.data;
    }

    getLogger().info(`Loaded ${data.length} player records`);

    return Ok(data);
  } catch (error) {
    getLogger().error('Failed to load players', error);
    if (error instanceof Error) {
      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading player data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
