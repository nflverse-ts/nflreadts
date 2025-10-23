import { describe, expect, it } from 'vitest';

import { hello, version } from '../src/index';

describe('nflreadts', () => {
  it('should export version', () => {
    expect(version).toBe('0.0.1');
  });

  it('should return welcome message', () => {
    expect(hello()).toBe('Welcome to nflreadts!');
  });
});
