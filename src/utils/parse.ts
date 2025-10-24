/**
 * Data parsing utilities
 * @module utils/parse
 */

import { asyncBufferFromFile, asyncBufferFromUrl, parquetReadObjects } from 'hyparquet';
import Papa from 'papaparse';

import { InvalidDataError } from '../types/error.js';

/**
 * CSV parsing options
 */
export interface CsvParseOptions {
  /**
   * First row contains headers
   * @default true
   */
  header?: boolean;

  /**
   * Skip empty lines
   * @default true
   */
  skipEmptyLines?: boolean;

  /**
   * Dynamically type values
   * @default true
   */
  dynamicTyping?: boolean;

  /**
   * Transform header names
   */
  transformHeader?: (header: string) => string;
}

/**
 * Parse result from CSV parsing
 */
export interface ParseResult<T = unknown> {
  /**
   * Parsed data rows
   */
  data: T[];

  /**
   * Parse errors
   */
  errors: Papa.ParseError[];

  /**
   * Metadata about the parse
   */
  meta: Papa.ParseMeta;
}

/**
 * Parse CSV string to array of objects
 */
export function parseCsv<T = Record<string, unknown>>(
  csvString: string,
  options: CsvParseOptions = {}
): ParseResult<T> {
  const { header = true, skipEmptyLines = true, dynamicTyping = true, transformHeader } = options;

  const parseConfig: Papa.ParseConfig<T> = {
    header,
    skipEmptyLines: skipEmptyLines === true ? 'greedy' : false,
    dynamicTyping,
  };

  if (transformHeader) {
    parseConfig.transformHeader = transformHeader;
  }

  const result = Papa.parse<T>(csvString, parseConfig);

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join('; ');
    throw new InvalidDataError(`CSV parse errors: ${errorMessages}`, {
      errors: result.errors,
    });
  }

  return {
    data: result.data,
    errors: result.errors,
    meta: result.meta,
  };
}

/**
 * Parse CSV from a response
 */
export async function parseCsvFromResponse<T = Record<string, unknown>>(
  response: Response,
  options: CsvParseOptions = {}
): Promise<ParseResult<T>> {
  const csvString = await response.text();
  return parseCsv<T>(csvString, options);
}

/**
 * Parse JSON string safely
 */
export function parseJson<T = unknown>(jsonString: string): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new InvalidDataError(
      'Failed to parse JSON',
      { originalError: error instanceof Error ? error.message : String(error) },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse JSON from a response
 */
export async function parseJsonFromResponse<T = unknown>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new InvalidDataError(
      'Failed to parse JSON response',
      { originalError: error instanceof Error ? error.message : String(error) },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Convert string to number safely
 */
export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Convert string to boolean
 */
export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return null;
}

/**
 * Parse an integer safely
 */
export function parseIntSafe(value: unknown): number | null {
  const num = parseNumber(value);
  return num !== null ? Math.floor(num) : null;
}

/**
 * Parse a float safely
 */
export function parseFloatSafe(value: unknown): number | null {
  return parseNumber(value);
}

/**
 * Clean column name (convert to snake_case, remove special chars)
 */
export function cleanColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/[^a-z0-9_]/g, '') // remove special chars
    .replace(/_+/g, '_') // multiple underscores to single
    .replace(/^_|_$/g, ''); // remove leading/trailing underscores
}

/**
 * Transform CSV headers to clean column names
 */
export function transformCsvHeader(header: string): string {
  return cleanColumnName(header);
}

/**
 * Detect delimiter in a CSV string
 */
export function detectDelimiter(csvString: string): string {
  const sample = csvString.split('\n')[0] ?? '';
  const delimiters = [',', ';', '\t', '|'];

  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = sample.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Convert array of objects to CSV string
 */
export function toCsv<T extends Record<string, unknown>>(
  data: T[],
  options: {
    header?: boolean;
    delimiter?: string;
  } = {}
): string {
  const { header = true, delimiter = ',' } = options;

  return Papa.unparse(data, {
    header,
    delimiter,
  });
}

/**
 * Convert CSV to JSON
 */
export function csvToJson<T = Record<string, unknown>>(
  csvString: string,
  options: CsvParseOptions = {}
): T[] {
  const result = parseCsv<T>(csvString, options);
  return result.data;
}

/**
 * Convert JSON to CSV
 */
export function jsonToCsv<T extends Record<string, unknown>>(data: T[]): string {
  return toCsv(data);
}

/**
 * Parquet parsing options
 */
export interface ParquetParseOptions {
  /**
   * Columns to read (undefined = all columns)
   */
  columns?: string[];

  /**
   * Starting row index
   */
  rowStart?: number;

  /**
   * Ending row index (exclusive)
   */
  rowEnd?: number;
}

/**
 * Helper to build parquet read options with proper typing
 */
function buildParquetReadOptions<T>(
  file: T,
  options: ParquetParseOptions
): {
  file: T;
  columns?: string[];
  rowStart?: number;
  rowEnd?: number;
} {
  const readOptions: {
    file: T;
    columns?: string[];
    rowStart?: number;
    rowEnd?: number;
  } = { file };

  if (options.columns !== undefined) {
    readOptions.columns = options.columns;
  }
  if (options.rowStart !== undefined) {
    readOptions.rowStart = options.rowStart;
  }
  if (options.rowEnd !== undefined) {
    readOptions.rowEnd = options.rowEnd;
  }

  return readOptions;
}

/**
 * Parse Parquet data from ArrayBuffer
 * @param buffer - ArrayBuffer containing Parquet data
 * @param options - Parsing options
 * @returns Parsed data as array of objects
 */
export async function parseParquet<T = Record<string, unknown>>(
  buffer: ArrayBuffer,
  options: ParquetParseOptions = {}
): Promise<T[]> {
  try {
    // Create async buffer wrapper
    const asyncBuffer = {
      byteLength: buffer.byteLength,
      slice(start: number, end?: number): Promise<ArrayBuffer> {
        return Promise.resolve(buffer.slice(start, end));
      },
    };

    const readOptions = buildParquetReadOptions(asyncBuffer, options);
    const data = await parquetReadObjects(readOptions);

    return data as T[];
  } catch (error) {
    throw new InvalidDataError(
      `Failed to parse Parquet data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { options },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse Parquet file from URL
 * @param url - URL to Parquet file
 * @param options - Parsing options
 * @returns Parsed data as array of objects
 */
export async function parseParquetFromUrl<T = Record<string, unknown>>(
  url: string,
  options: ParquetParseOptions = {}
): Promise<T[]> {
  try {
    const file = await asyncBufferFromUrl({ url });
    const readOptions = buildParquetReadOptions(file, options);
    const data = await parquetReadObjects(readOptions);

    return data as T[];
  } catch (error) {
    throw new InvalidDataError(
      `Failed to parse Parquet from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { url, options },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse Parquet file from local file path (Node.js only)
 * @param filePath - Path to Parquet file
 * @param options - Parsing options
 * @returns Parsed data as array of objects
 */
export async function parseParquetFromFile<T = Record<string, unknown>>(
  filePath: string,
  options: ParquetParseOptions = {}
): Promise<T[]> {
  try {
    const file = await asyncBufferFromFile(filePath);
    const readOptions = buildParquetReadOptions(file, options);
    const data = await parquetReadObjects(readOptions);

    return data as T[];
  } catch (error) {
    throw new InvalidDataError(
      `Failed to parse Parquet from file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { filePath, options },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse Parquet data from HTTP response
 * @param response - Response object containing Parquet data
 * @param options - Parsing options
 * @returns Parsed data as array of objects
 */
export async function parseParquetFromResponse<T = Record<string, unknown>>(
  response: Response,
  options: ParquetParseOptions = {}
): Promise<T[]> {
  try {
    const buffer = await response.arrayBuffer();
    return parseParquet<T>(buffer, options);
  } catch (error) {
    throw new InvalidDataError(
      `Failed to parse Parquet from response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { url: response.url, options },
      error instanceof Error ? error : undefined
    );
  }
}
