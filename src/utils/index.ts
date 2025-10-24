/**
 * Utility functions and helpers
 * @module utils
 */

// Validation utilities
export {
  MIN_SEASON,
  MAX_REGULAR_SEASON_WEEK,
  MAX_PLAYOFF_WEEK,
  SEASON_TYPES,
  getCurrentSeason,
  isValidSeason,
  assertValidSeason,
  isValidWeek,
  assertValidWeek,
  isValidTeam,
  isValidTeamOrHistorical,
  assertValidTeam,
  isValidSeasonType,
  assertValidSeasonType,
  isValidPlayerId,
  assertValidPlayerId,
  validateSeasons,
  validateTeams,
  normalizeTeamAbbr,
} from './validation.js';

// Date/time utilities
export {
  parseDate,
  formatDate,
  getToday,
  getSeasonFromDate,
  getSeasonStartDate,
  getSeasonEndDate,
  isDateInSeason,
  getCurrentWeek,
  generateSeasonRange,
  generateWeekRange,
  getWeeksForSeasonType,
  isFutureDate,
  isPastDate,
  daysBetween,
  addDays,
  formatDateLong,
  formatDateShort,
} from './datetime.js';

// URL utilities
export type { DataFileType, FileFormat } from './url.js';

export {
  buildNflverseUrl,
  buildPbpUrl,
  buildPlayerStatsUrl,
  buildRosterUrl,
  buildWeeklyRosterUrl,
  buildScheduleUrl,
  buildTeamsUrl,
  buildPlayersUrl,
  buildParticipationUrl,
  buildDepthChartsUrl,
  buildInjuriesUrl,
  buildDraftPicksUrl,
  buildContractsUrl,
  buildNextGenStatsUrl,
  buildSnapCountsUrl,
  buildQueryString,
  addQueryParams,
  getFilenameFromUrl,
  isNflverseUrl,
  normalizeUrl,
  joinUrlParts,
} from './url.js';

// Parse utilities
export type { CsvParseOptions, ParseResult } from './parse.js';

export {
  parseCsv,
  parseCsvFromResponse,
  parseJson,
  parseJsonFromResponse,
  parseNumber,
  parseBoolean,
  parseIntSafe,
  parseFloatSafe,
  cleanColumnName,
  transformCsvHeader,
  detectDelimiter,
  toCsv,
  csvToJson,
  jsonToCsv,
} from './parse.js';

// Logger utilities
export { LogLevel, Logger, getLogger, resetLogger, createLogger } from './logger.js';
