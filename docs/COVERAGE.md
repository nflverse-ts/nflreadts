# Code Coverage Guide

This document explains how code coverage works in nflreadts and how to maintain high coverage standards.

## Coverage Goals

We aim for **>80% code coverage** across all metrics:
- Lines
- Functions
- Branches
- Statements

These thresholds are enforced in [vitest.config.ts](../vitest.config.ts) and will cause builds to fail if not met.

## Running Coverage Reports

### Local Development

```bash
# Run tests with coverage
npm run test:coverage

# View HTML report
# Open coverage/index.html in your browser after running tests
```

### Watch Mode

```bash
# Run tests in watch mode (no coverage)
npm run test:watch

# Run with UI for interactive testing
npm run test:ui
```

## Coverage Reports

After running `npm run test:coverage`, you'll find reports in the `coverage/` directory:

- **coverage/index.html** - Interactive HTML report (open in browser)
- **coverage/lcov.info** - LCOV format for CI tools
- **coverage/coverage-final.json** - JSON format for programmatic access

## CI/CD Integration

### GitHub Actions

Our CI workflow ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) automatically:
1. Runs tests with coverage on every push/PR
2. Uploads coverage reports to Codecov
3. Fails the build if coverage drops below 80%

### Codecov

We use Codecov to track coverage over time. Configuration is in [codecov.yml](../codecov.yml).

**Features**:
- Coverage trends over time
- PR comments with coverage diff
- Coverage badges for README
- Automatic coverage checks

## What's Excluded from Coverage

The following are excluded from coverage calculations (see [vitest.config.ts:10-20](../vitest.config.ts#L10-L20)):

- `node_modules/` - Third-party dependencies
- `dist/` - Build output
- `tests/` - Test files themselves
- `**/*.test.ts` - Test files
- `**/*.spec.ts` - Spec files
- `**/types.ts` - Pure type definition files
- `**/*.config.ts` - Configuration files
- `**/*.config.js` - Configuration files
- `**/*.config.cjs` - Configuration files

## Writing Testable Code

### Tips for High Coverage

1. **Write Small, Focused Functions**
   ```typescript
   // Good - easy to test
   function add(a: number, b: number): number {
     return a + b;
   }

   // Bad - hard to test
   function doEverything(data: any) {
     // 100 lines of mixed logic
   }
   ```

2. **Separate Pure Logic from Side Effects**
   ```typescript
   // Pure function - easy to test
   function calculateScore(stats: Stats): number {
     return stats.points + stats.bonus;
   }

   // Side effect - needs mocking
   async function saveScore(score: number): Promise<void> {
     await database.save(score);
   }
   ```

3. **Use Dependency Injection**
   ```typescript
   // Good - testable
   class DataLoader {
     constructor(private http: HttpClient) {}

     async load(url: string) {
       return this.http.get(url);
     }
   }

   // Bad - hard to test
   class DataLoader {
     async load(url: string) {
       return fetch(url); // Hard-coded dependency
     }
   }
   ```

4. **Test All Branches**
   ```typescript
   function classify(score: number): string {
     if (score >= 90) return 'A';
     if (score >= 80) return 'B';
     if (score >= 70) return 'C';
     return 'F';
   }

   // Make sure tests cover:
   // score = 95 -> 'A'
   // score = 85 -> 'B'
   // score = 75 -> 'C'
   // score = 60 -> 'F'
   // score = 90 (boundary)
   // score = 80 (boundary)
   // score = 70 (boundary)
   ```

## Coverage Best Practices

### DO

- ✅ Test happy paths and error cases
- ✅ Test boundary conditions
- ✅ Test edge cases (null, undefined, empty arrays, etc.)
- ✅ Mock external dependencies (HTTP, file system, etc.)
- ✅ Use parameterized tests for multiple scenarios
- ✅ Aim for meaningful coverage, not just numbers

### DON'T

- ❌ Skip tests to meet deadlines
- ❌ Write tests that don't assert anything
- ❌ Ignore uncovered branches
- ❌ Test implementation details instead of behavior
- ❌ Copy-paste test code without understanding it

## Example Test with High Coverage

```typescript
import { describe, expect, it } from 'vitest';
import { processPlayerStats } from '../src/stats';

describe('processPlayerStats', () => {
  it('should calculate total yards', () => {
    const stats = { rushing: 50, receiving: 100, passing: 0 };
    expect(processPlayerStats(stats).totalYards).toBe(150);
  });

  it('should handle missing stats', () => {
    const stats = { rushing: 50 };
    expect(processPlayerStats(stats).totalYards).toBe(50);
  });

  it('should throw on invalid input', () => {
    expect(() => processPlayerStats(null)).toThrow();
  });

  it('should handle zero values', () => {
    const stats = { rushing: 0, receiving: 0, passing: 0 };
    expect(processPlayerStats(stats).totalYards).toBe(0);
  });

  it('should handle negative values', () => {
    const stats = { rushing: -10, receiving: 50 };
    expect(processPlayerStats(stats).totalYards).toBe(40);
  });
});
```

This test suite achieves high coverage by testing:
- Normal case (happy path)
- Missing data (partial input)
- Error case (null input)
- Edge case (zero values)
- Edge case (negative values)

## Monitoring Coverage

### Local

```bash
# Check current coverage
npm run test:coverage

# Look for uncovered lines in the terminal output
# Open coverage/index.html for detailed view
```

### On GitHub

1. Check the PR comment from Codecov bot
2. Review the coverage diff (lines added/removed)
3. Click through to see which lines are uncovered
4. Add tests to cover missing branches

## Troubleshooting

### "Coverage threshold not met"

**Problem**: Build fails with coverage below 80%

**Solution**:
1. Run `npm run test:coverage` locally
2. Open `coverage/index.html` in browser
3. Find uncovered lines (highlighted in red)
4. Write tests to cover those lines
5. Re-run coverage to verify

### "No coverage data found"

**Problem**: Coverage reports are empty

**Solution**:
1. Ensure tests are in `tests/` directory
2. Ensure test files end in `.test.ts` or `.spec.ts`
3. Verify `@vitest/coverage-v8` is installed
4. Run `npm install` to ensure all deps are present

### "Coverage decreased in PR"

**Problem**: Codecov reports coverage drop

**Solution**:
1. Check which new lines are uncovered
2. Add tests for new code
3. Ensure all branches are tested
4. Consider if new code is testable (refactor if needed)

## Resources

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Istanbul Coverage Guide](https://istanbul.js.org/)

## Questions?

If you have questions about coverage or testing, please:
1. Check this documentation
2. Review existing tests in `tests/`
3. Ask in GitHub Discussions
4. Open an issue if you find a problem

---

Remember: The goal is **meaningful coverage**, not just hitting a number. Write tests that verify behavior and catch bugs!
