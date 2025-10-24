/**
 * Error types and result patterns
 * @module types/error
 */

/**
 * Error codes for nflreadts errors
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',

  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  PARSE_ERROR = 'PARSE_ERROR',

  // Validation errors
  INVALID_SEASON = 'INVALID_SEASON',
  INVALID_WEEK = 'INVALID_WEEK',
  INVALID_TEAM = 'INVALID_TEAM',
  INVALID_PLAYER = 'INVALID_PLAYER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',

  // Cache errors
  CACHE_ERROR = 'CACHE_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base error class for nflreadts
 */
export class NflReadError extends Error {
  /**
   * Error code
   */
  public readonly code: ErrorCode;

  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = 'NflReadError';
    this.code = code;
    this.context = context ?? {};

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NflReadError);
    }
  }

  /**
   * Create a JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends NflReadError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, ErrorCode.NETWORK_ERROR, context, cause);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NflReadError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.TIMEOUT, context);
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends NflReadError {
  /**
   * When the rate limit resets (timestamp)
   */
  public readonly resetAt?: number;

  constructor(message: string, resetAt?: number, context?: Record<string, unknown>) {
    super(message, ErrorCode.RATE_LIMIT, context);
    this.name = 'RateLimitError';
    this.resetAt = resetAt ?? 0;
  }
}

/**
 * Data not found errors
 */
export class DataNotFoundError extends NflReadError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.DATA_NOT_FOUND, context);
    this.name = 'DataNotFoundError';
  }
}

/**
 * Invalid data errors
 */
export class InvalidDataError extends NflReadError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, ErrorCode.INVALID_DATA, context, cause);
    this.name = 'InvalidDataError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends NflReadError {
  constructor(message: string, code: ErrorCode, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'ValidationError';
  }
}

/**
 * Result type for operations that can fail
 * Using discriminated union pattern for type safety
 */
export type Result<T, E = NflReadError> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Create a successful result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard for successful results
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Type guard for error results
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

/**
 * Unwrap a result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Map a result's value
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? Ok(fn(result.value)) : result;
}

/**
 * Map a result's error
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isErr(result) ? Err(fn(result.error)) : result;
}
