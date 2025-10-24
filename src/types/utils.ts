/**
 * Utility types and patterns
 * @module types/utils
 */

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make all properties nullable
 */
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Make specific properties nullable
 */
export type NullableFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

/**
 * Awaited type for promises (built-in from TS 4.5+, but defining for completeness)
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Make all nested properties readonly
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 * Filter options for data loading
 */
export interface FilterOptions {
  /**
   * Limit number of results
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Sort field
   */
  sortBy?: string;

  /**
   * Sort direction
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Data loading options (common across all load functions)
 */
export interface LoadOptions extends FilterOptions {
  /**
   * Force refresh (bypass cache)
   */
  forceRefresh?: boolean;

  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /**
   * Array of data items
   */
  data: T[];

  /**
   * Total number of items available
   */
  total: number;

  /**
   * Current page offset
   */
  offset: number;

  /**
   * Number of items in current page
   */
  limit: number;

  /**
   * Whether there are more items
   */
  hasMore: boolean;
}

/**
 * Data state discriminated union for loading states
 */
export type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Type guard for success state
 */
export function isSuccess<T>(state: DataState<T>): state is { status: 'success'; data: T } {
  return state.status === 'success';
}

/**
 * Type guard for error state
 */
export function isError<T>(state: DataState<T>): state is { status: 'error'; error: Error } {
  return state.status === 'error';
}

/**
 * Type guard for loading state
 */
export function isLoading<T>(state: DataState<T>): state is { status: 'loading' } {
  return state.status === 'loading';
}

/**
 * Range type for filtering
 */
export interface Range<T> {
  min?: T;
  max?: T;
}

/**
 * Type for season range
 */
export type SeasonRange = Range<number>;

/**
 * Type for week range
 */
export type WeekRange = Range<number>;
