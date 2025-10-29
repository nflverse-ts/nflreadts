/**
 * Player data loading functionality
 * @module data/players
 */

import { HttpClient } from '../client/client.js';
import type { LoadPlayersOptions, PlayerRecord } from '../types';
import { getLogger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { buildPlayersUrl } from '../utils/url.js';

const logger = getLogger();

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
 * @returns Promise resolving to array of player records
 *
 * @example
 * ```typescript
 * // Load all players (CSV format)
 * const players = await loadPlayers();
 *
 * // Load using Parquet format for better performance
 * const players = await loadPlayers({ format: 'parquet' });
 *
 * // Find a specific player
 * const mahomes = players.find(p => p.display_name === 'Patrick Mahomes');
 * console.log(mahomes?.gsis_id); // '00-0033873'
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_players.html
 */
export async function loadPlayers(options: LoadPlayersOptions = {}): Promise<PlayerRecord[]> {
  const { format = 'csv', ...loadOptions } = options;

  logger.info(`Loading players data (format: ${format})`);

  const client = new HttpClient();

  // Build URL for the format
  const url = buildPlayersUrl(format);

  logger.debug(`Fetching from: ${url}`);

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

  logger.info(`Loaded ${data.length} player records`);

  return data;
}
