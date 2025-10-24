/**
 * Tests for type guard functions
 * These test runtime behavior, not type checking
 */

import { describe, it, expect } from 'vitest';

import { isSuccess, isError, isLoading } from '../../src/types/utils.js';

import type { DataState } from '../../src/types/utils.js';

describe('Utility Types', () => {
  describe('DataState type guards', () => {
    it('should identify success state', () => {
      const state: DataState<number> = { status: 'success', data: 42 };
      expect(isSuccess(state)).toBe(true);
      expect(isError(state)).toBe(false);
      expect(isLoading(state)).toBe(false);

      if (isSuccess(state)) {
        expect(state.data).toBe(42);
      }
    });

    it('should identify error state', () => {
      const error = new Error('Test error');
      const state: DataState<number> = { status: 'error', error };
      expect(isSuccess(state)).toBe(false);
      expect(isError(state)).toBe(true);
      expect(isLoading(state)).toBe(false);

      if (isError(state)) {
        expect(state.error).toBe(error);
      }
    });

    it('should identify loading state', () => {
      const state: DataState<number> = { status: 'loading' };
      expect(isSuccess(state)).toBe(false);
      expect(isError(state)).toBe(false);
      expect(isLoading(state)).toBe(true);
    });

    it('should identify idle state', () => {
      const state: DataState<number> = { status: 'idle' };
      expect(isSuccess(state)).toBe(false);
      expect(isError(state)).toBe(false);
      expect(isLoading(state)).toBe(false);
    });
  });
});
