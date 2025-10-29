import type { Season } from '../types/common';
import type { NormalizeSeasonsOptions } from '../types/utils';
import { getCurrentSeason } from './datetime';

/**
 * Normalize season input into an array of seasons
 *
 * @param seasons - Season(s) to normalize. Can be:
 *   - `undefined`: Returns default season
 *   - `true`: Returns all seasons from minSeason to maxSeason
 *   - Single season: Returns array with that season
 *   - Array of seasons: Returns the array as-is
 * @param options - Configuration options
 * @returns Array of seasons
 *
 * @example
 * ```typescript
 * // Use current season (default)
 * normalizeSeasons(); // [2024]
 *
 * // Single season
 * normalizeSeasons(2023); // [2023]
 *
 * // Multiple seasons
 * normalizeSeasons([2022, 2023]); // [2022, 2023]
 *
 * // All seasons with custom range
 * normalizeSeasons(true, { minSeason: 1920, maxSeason: 2024 }); // [1920, 1921, ..., 2024]
 *
 * // All seasons with default range (1999-present)
 * normalizeSeasons(true); // [1999, 2000, ..., 2024]
 * ```
 */
export function normalizeSeasons(
  seasons?: Season | Season[] | true,
  options: NormalizeSeasonsOptions = {}
): Season[] {
  const currentSeason = getCurrentSeason();
  const { minSeason = 1999, maxSeason = currentSeason, defaultSeason = currentSeason } = options;

  // If undefined, use default season
  if (seasons === undefined) {
    return [defaultSeason];
  }

  // If true, return all available seasons from minSeason to maxSeason
  if (seasons === true) {
    const yearCount = maxSeason - minSeason + 1;
    const allSeasons: Season[] = new Array<number>(yearCount);
    for (let i = 0; i < yearCount; i++) {
      allSeasons[i] = minSeason + i;
    }
    return allSeasons;
  }

  // If array, return as-is
  if (Array.isArray(seasons)) {
    return seasons;
  }

  // If single season, wrap in array
  return [seasons];
}
