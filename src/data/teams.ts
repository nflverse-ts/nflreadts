/**
 * Load team information and metadata
 * @module data/teams
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import type { LoadTeamsOptions, TeamRecord } from '../types/team.js';
import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { parseCsv, parseParquet } from '../utils/parse.js';
import { buildTeamsUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('teams'));

/**
 * Load NFL team information and metadata
 *
 * Returns comprehensive team data including identifiers, conference/division assignments,
 * branding colors (hex codes), and various logo URLs. Useful for creating visualizations,
 * plots, and team-based analytics.
 *
 * Team data includes both current and historical teams, with the `current` option
 * allowing you to filter for only active teams with standard abbreviations.
 *
 * @param options - Load options including format and current filter
 * @returns Result containing array of team records or an error
 *
 * @example
 * ```typescript
 * // Load all current teams (default)
 * const result = await loadTeams();
 * if (result.ok) {
 *   const teams = result.value;
 *   console.log(`Loaded ${teams.length} teams`);
 *
 *   // Find a specific team
 *   const chiefs = teams.find(t => t.team_abbr === 'KC');
 *   console.log(chiefs?.team_name); // "Kansas City Chiefs"
 *   console.log(chiefs?.team_color); // "#E31837"
 *
 *   // Get all AFC teams
 *   const afcTeams = teams.filter(t => t.team_conf === 'AFC');
 *
 *   // Use team colors for plotting
 *   teams.forEach(team => {
 *     console.log(`${team.team_name}: Primary=${team.team_color}, Secondary=${team.team_color2}`);
 *   });
 * } else {
 *   console.error('Error loading teams:', result.error);
 * }
 *
 * // Load with Parquet format for better performance
 * const parquetResult = await loadTeams({ format: 'parquet' });
 *
 * // Include historical teams and non-standard abbreviations
 * const allResult = await loadTeams({ current: false });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_teams.html
 */
export async function loadTeams(
  options: LoadTeamsOptions = {}
): Promise<Result<TeamRecord[], Error>> {
  const { format = 'csv', current = true, ...loadOptions } = options;

  try {
    // Validate format parameter
    assertValidFormat(format);

    getLogger().info(`Loading teams data (format: ${format}, current: ${current})`);

    const config = getConfig();
    const client = new HttpClient({
      timeout: config.http.timeout,
      retry: config.http.retries,
      cache: config.cache.enabled,
      cacheTtl: config.cache.ttl,
      debug: config.logging.debug,
    });

    // Build URL for the format
    const url = buildTeamsUrl(format);

    getLogger().debug(`Fetching from: ${url}`);

    // Fetch the data
    const response = await client.get(url, loadOptions);

    // Parse based on format
    let data: TeamRecord[];

    if (format === 'parquet') {
      const buffer = response.data as ArrayBuffer;
      data = await parseParquet<TeamRecord>(buffer);
    } else {
      const csvString =
        typeof response.data === 'string'
          ? response.data
          : new TextDecoder().decode(response.data as ArrayBuffer);
      const parseResult = parseCsv<TeamRecord>(csvString);
      data = parseResult.data;
    }

    // Filter for current teams if requested
    // Note: The nflreadr implementation filters based on a 'team_current' field
    // If the data doesn't have this field, we'll return all teams when current=true
    // This matches the behavior where current teams are the default in nflverse
    if (current && data.length > 0) {
      // Check if the data has a field indicating current teams
      // We need to check dynamically since team_current is not in our TeamRecord type
      const firstRecord = data[0];

      if (firstRecord && 'team_current' in (firstRecord as object)) {
        // Define a type guard for filtering
        const isCurrentTeam = (team: TeamRecord): boolean => {
          const record = team as TeamRecord & { team_current?: boolean | number };
          return record.team_current === true || record.team_current === 1;
        };

        data = data.filter(isCurrentTeam);
        getLogger().debug(`Filtered to ${data.length} current teams`);
      }
    }

    getLogger().info(`Loaded ${data.length} team records`);

    return Ok(data);
  } catch (error) {
    getLogger().error('Failed to load teams', error);
    if (error instanceof Error) {
      // Convert to appropriate error type
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading team data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
