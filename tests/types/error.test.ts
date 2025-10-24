/**
 * Tests for error types
 */

import { describe, it, expect } from 'vitest';

import {
  ErrorCode,
  NflReadError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  DataNotFoundError,
  InvalidDataError,
  ValidationError,
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  mapResult,
  mapError,
} from '../../src/types/error.js';

describe('Error Types', () => {
  describe('NflReadError', () => {
    it('should create error with message and code', () => {
      const error = new NflReadError('Test error', ErrorCode.UNKNOWN_ERROR);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.name).toBe('NflReadError');
    });

    it('should create error with context', () => {
      const context = { season: 2023, team: 'KC' };
      const error = new NflReadError('Test error', ErrorCode.DATA_NOT_FOUND, context);

      expect(error.context).toEqual(context);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new NflReadError('Wrapped error', ErrorCode.NETWORK_ERROR, undefined, cause);

      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON', () => {
      const error = new NflReadError('Test', ErrorCode.TIMEOUT, { foo: 'bar' });
      const json = error.toJSON();

      expect(json.name).toBe('NflReadError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe(ErrorCode.TIMEOUT);
      expect(json.context).toEqual({ foo: 'bar' });
      expect(json.stack).toBeDefined();
    });
  });

  describe('Specific Error Types', () => {
    it('should create NetworkError', () => {
      const error = new NetworkError('Network failed');
      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(NflReadError);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Request timed out');
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.code).toBe(ErrorCode.TIMEOUT);
    });

    it('should create RateLimitError with resetAt', () => {
      const resetAt = Date.now() + 60000;
      const error = new RateLimitError('Rate limited', resetAt);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe(ErrorCode.RATE_LIMIT);
      expect(error.resetAt).toBe(resetAt);
    });

    it('should create DataNotFoundError', () => {
      const error = new DataNotFoundError('Data not found');
      expect(error).toBeInstanceOf(DataNotFoundError);
      expect(error.code).toBe(ErrorCode.DATA_NOT_FOUND);
    });

    it('should create InvalidDataError', () => {
      const error = new InvalidDataError('Invalid data format');
      expect(error).toBeInstanceOf(InvalidDataError);
      expect(error.code).toBe(ErrorCode.INVALID_DATA);
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid season', ErrorCode.INVALID_SEASON);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.INVALID_SEASON);
    });
  });

  describe('Result Type', () => {
    it('should create Ok result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should create Err result', () => {
      const error = new NflReadError('Test');
      const result = Err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('should check if result is Ok', () => {
      const okResult = Ok(42);
      const errResult = Err(new NflReadError('Test'));

      expect(isOk(okResult)).toBe(true);
      expect(isOk(errResult)).toBe(false);
    });

    it('should check if result is Err', () => {
      const okResult = Ok(42);
      const errResult = Err(new NflReadError('Test'));

      expect(isErr(okResult)).toBe(false);
      expect(isErr(errResult)).toBe(true);
    });

    it('should unwrap Ok result', () => {
      const result = Ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw when unwrapping Err result', () => {
      const error = new NflReadError('Test');
      const result = Err(error);
      expect(() => unwrap(result)).toThrow(error);
    });

    it('should unwrap with default value', () => {
      const okResult = Ok(42);
      const errResult = Err(new NflReadError('Test'));

      expect(unwrapOr(okResult, 0)).toBe(42);
      expect(unwrapOr(errResult, 0)).toBe(0);
    });

    it('should map Ok result value', () => {
      const result = Ok(42);
      const mapped = mapResult(result, (x) => x * 2);

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(84);
      }
    });

    it('should not map Err result value', () => {
      const error = new NflReadError('Test');
      const result = Err(error);
      const mapped = mapResult(result, (x: number) => x * 2);

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });

    it('should map Err result error', () => {
      const error = new NflReadError('Test', ErrorCode.UNKNOWN_ERROR);
      const result = Err(error);
      const mapped = mapError(result, (e) => new NetworkError(e.message));

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBeInstanceOf(NetworkError);
        expect(mapped.error.message).toBe('Test');
      }
    });

    it('should not map Ok result error', () => {
      const result = Ok(42);
      const mapped = mapError(result, (e: Error) => new NetworkError(e.message));

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });
  });
});
