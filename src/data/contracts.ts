/**
 * Load player contract data (OverTheCap)
 * @module data/contracts
 */

import type { ContractRecord, LoadContractsOptions } from '../types/contracts.js';

import { Err, NetworkError, Ok, type Result } from '../types/error.js';
import { createLogger, type Logger } from '../utils/logger.js';
import { buildContractsUrl } from '../utils/url.js';
import { assertValidFormat } from '../utils/validation.js';
import { createDataClient, fetchParsedAsset } from './internal.js';

// Lazy logger initialization to avoid module-level side effects
let logger: Logger | undefined;
const getLogger = () => logger ?? (logger = createLogger('contracts'));

/**
 * Load historical player contract data
 *
 * Returns every historical contract from OverTheCap (not just each player's
 * current deal) with total value, APY, guarantees, cap percentages, and
 * inflation-adjusted figures. Dollar amounts are in millions. The parquet
 * asset additionally includes nested per-season cap detail in `cols`.
 *
 * There is no seasons parameter, matching nflreadr::load_contracts(); the
 * dataset is a single snapshot of all contracts.
 *
 * The default format is 'parquet' because nflverse does not publish a plain
 * .csv asset for contracts (requesting 'csv' will fail with a 404).
 *
 * @param options - Load options including format and caching
 * @returns Result containing array of contract records or an error
 *
 * @example
 * ```typescript
 * // Load all contracts
 * const result = await loadContracts();
 * if (result.ok) {
 *   const contracts = result.value;
 *   console.log(`Loaded ${contracts.length} contracts`);
 *
 *   // Active QB contracts by APY
 *   const qbDeals = contracts
 *     .filter(c => c.position === 'QB' && c.is_active)
 *     .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));
 *
 *   // Per-season cap detail for the top deal
 *   console.log(qbDeals[0]?.cols);
 * } else {
 *   console.error('Error loading contracts:', result.error);
 * }
 *
 * // Pass an abort signal
 * const controller = new AbortController();
 * const abortable = await loadContracts({ signal: controller.signal });
 * ```
 *
 * @see https://nflreadr.nflverse.com/reference/load_contracts.html
 */
export async function loadContracts(
  options: LoadContractsOptions = {}
): Promise<Result<ContractRecord[], Error>> {
  // Parquet is the default: nflverse publishes no plain .csv for contracts
  const { format = 'parquet', ...loadOptions } = options;

  try {
    assertValidFormat(format);

    getLogger().info('Loading contracts (all historical contracts)');

    const url = buildContractsUrl(format);
    getLogger().debug(`Fetching contract data from: ${url}`);

    const client = createDataClient();
    const contracts = await fetchParsedAsset<ContractRecord>(client, url, format, loadOptions);

    getLogger().info(`Loaded ${contracts.length} contract records`);

    return Ok(contracts);
  } catch (error) {
    getLogger().error('Failed to load contracts', error);
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return Err(
          new NetworkError('Network error loading contract data', {
            originalError: error.message,
          })
        );
      }
      return Err(error);
    }
    return Err(new Error(String(error)));
  }
}
