import type { Season } from '../types';
import { MIN_PARTICIPATION_SEASON } from '../types/constants';
import { getCurrentSeason } from './datetime';

export function normalizeSeasons(
  seasons?: Season | Season[] | true,
  isParticipation: boolean = false
): Season[] {
  // If undefined, use current season
  if (seasons === undefined) {
    return [getCurrentSeason()];
  }

  // If true, return all available seasons (1999-present for pbp/stats, 2016-present for participation)
  if (seasons === true) {
    const currentSeason = getCurrentSeason();
    const startSeason = isParticipation ? MIN_PARTICIPATION_SEASON : 1999;
    const yearCount = currentSeason - startSeason + 1;
    const allSeasons: Season[] = new Array<number>(yearCount);
    for (let i = 0; i < yearCount; i++) {
      allSeasons[i] = startSeason + i;
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
