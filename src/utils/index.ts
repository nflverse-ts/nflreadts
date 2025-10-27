/**
 * Utility functions and helpers
 * @module utils
 */

// Validation utilities
export {
  assertValidPlayerId,
  assertValidSeason,
  assertValidSeasonType,
  assertValidTeam,
  assertValidWeek,
  isValidPlayerId,
  isValidSeason,
  isValidSeasonType,
  isValidTeam,
  isValidTeamOrHistorical,
  isValidWeek,
  MAX_PLAYOFF_WEEK,
  MAX_REGULAR_SEASON_WEEK,
  MIN_SEASON,
  normalizeTeamAbbr,
  SEASON_TYPES,
  validateSeasons,
  validateTeams,
} from './validation.js';

// Date/time utilities
export {
  addDays,
  daysBetween,
  formatDate,
  formatDateLong,
  formatDateShort,
  generateSeasonRange,
  generateWeekRange,
  getCurrentSeason,
  getCurrentWeek,
  getSeasonEndDate,
  getSeasonFromDate,
  getSeasonStartDate,
  getToday,
  getWeeksForSeasonType,
  isDateInSeason,
  isFutureDate,
  isPastDate,
  parseDate,
} from './datetime.js';

// URL utilities
export type { DataFileType, FileFormat } from './url.js';

export {
  addQueryParams,
  buildContractsUrl,
  buildDepthChartsUrl,
  buildDraftPicksUrl,
  buildInjuriesUrl,
  buildNextGenStatsUrl,
  buildNflverseUrl,
  buildParticipationUrl,
  buildPbpUrl,
  buildPlayerStatsUrl,
  buildPlayersUrl,
  buildQueryString,
  buildRosterUrl,
  buildScheduleUrl,
  buildSnapCountsUrl,
  buildTeamsUrl,
  buildWeeklyRosterUrl,
  getFilenameFromUrl,
  isNflverseUrl,
  joinUrlParts,
  normalizeUrl,
} from './url.js';

// Parse utilities
export type { CsvParseOptions, ParquetParseOptions, ParseResult } from './parse.js';

export {
  cleanColumnName,
  csvToJson,
  detectDelimiter,
  jsonToCsv,
  parseBoolean,
  parseCsv,
  parseCsvFromResponse,
  parseFloatSafe,
  parseIntSafe,
  parseJson,
  parseJsonFromResponse,
  parseNumber,
  parseParquet,
  parseParquetFromFile,
  parseParquetFromResponse,
  parseParquetFromUrl,
  toCsv,
  transformCsvHeader,
} from './parse.js';

// Logger utilities
export { createLogger, getLogger, Logger, LogLevel, resetLogger } from './logger.js';

// Season utilities
export { normalizeSeasons } from './seasons.js';
