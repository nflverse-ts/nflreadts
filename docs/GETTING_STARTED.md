# Getting Started with nflreadts Development

This guide will help you set up your development environment for nflreadts.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 10.5.0 or higher (comes with Node.js)
- **Git**: For version control

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nflverse-ts/nflreadts.git
cd nflreadts
```

2. Install dependencies:
```bash
npm install
```

## Development Workflow

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Type Checking

```bash
# Run TypeScript type checker
npm run typecheck
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format
```

### Building

```bash
# Build the package
npm run build

# Build in watch mode (for development)
npm run build:watch
```

### All-in-One Validation

```bash
# Run all checks (typecheck, lint, format, test)
npm run validate
```

## Project Structure

```
nflreadts/
├── .github/
│   └── workflows/      # GitHub Actions CI/CD
├── docs/              # Documentation
├── src/               # Source code
│   └── index.ts       # Main entry point
├── tests/             # Test files
│   └── index.test.ts  # Tests
├── dist/              # Build output (generated)
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
├── tsup.config.ts     # Build configuration
├── vitest.config.ts   # Test configuration
└── README.md          # Project documentation
```

## Writing Code

### TypeScript Best Practices

- Use strict TypeScript settings (already configured)
- Avoid `any` - use `unknown` when type is truly unknown
- Leverage modern TypeScript features (const type parameters, satisfies, etc.)
- Use type inference where appropriate

### Code Style

- Follow the ESLint and Prettier configurations
- Use descriptive variable names
- Write JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write tests for all new functionality
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

### Example: Adding a New Function

1. Create the function in `src/`:
```typescript
// src/utils/example.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

2. Export it from `src/index.ts`:
```typescript
export { greet } from './utils/example';
```

3. Write a test in `tests/`:
```typescript
// tests/example.test.ts
import { describe, expect, it } from 'vitest';
import { greet } from '../src/utils/example';

describe('greet', () => {
  it('should greet by name', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});
```

4. Run validation:
```bash
npm run validate
```

## Continuous Integration

Every push and pull request will trigger GitHub Actions to:
- Run type checking
- Run linter
- Run formatter checks
- Run tests with coverage
- Build the package

Make sure all checks pass before submitting a PR.

## Need Help?

- Check the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- Review the [CLAUDE.md](../CLAUDE.md) for AI assistant guidance
- Check the [ROADMAP.md](../ROADMAP.md) for planned features
- Open an issue on GitHub

## Next Steps

1. Read the [ROADMAP.md](../ROADMAP.md) to understand the project plan
2. Check existing issues for something to work on
3. Start with Phase 1 tasks (Core Infrastructure)
4. Write tests first (TDD approach recommended)
5. Submit PRs early and often

Happy coding!
