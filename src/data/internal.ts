/**
 * Shared internals for data loaders (not exported from the package)
 * @module data/internal
 */

import { HttpClient } from '../client/client.js';
import { getConfig } from '../config/manager.js';
import { DataNotFoundError } from '../types/error.js';
import { parseCsv, parseParquet } from '../utils/parse.js';

/**
 * Create an HttpClient configured from the package config
 */
export function createDataClient(): HttpClient {
  const config = getConfig();
  return new HttpClient({
    timeout: config.http.timeout,
    retry: config.http.retries,
    cache: config.cache.enabled,
    cacheTtl: config.cache.ttl,
    debug: config.logging.debug,
  });
}

/**
 * Fetch a data asset and parse it according to format
 * Throws DataNotFoundError on non-200 responses
 */
export async function fetchParsedAsset<T>(
  client: HttpClient,
  url: string,
  format: 'csv' | 'parquet',
  options: { signal?: AbortSignal } = {}
): Promise<T[]> {
  const response = await client.get(url, options);

  if (response.status !== 200) {
    throw new DataNotFoundError(`Data not found at ${url}`, { url, status: response.status });
  }

  if (format === 'parquet') {
    return parseParquet<T>(response.data as ArrayBuffer);
  }

  const csvString =
    typeof response.data === 'string'
      ? response.data
      : new TextDecoder().decode(response.data as ArrayBuffer);
  return parseCsv<T>(csvString).data;
}

/**
 * Concatenate per-season result arrays efficiently
 */
export function concatSeasons<T>(arrays: T[][]): T[] {
  return arrays.length === 1 ? arrays[0]! : ([] as T[]).concat(...arrays);
}
