# Claude.md - AI Assistant Guidelines for nflreadts

This document provides guidance for AI assistants (like Claude) working on the nflreadts project.

## Project Overview

nflreadts is the TypeScript port of nflreadpy/nflreadr from the nflverse team. This project has been developed with approval from the nflverse team.

## Core Principles

### 1. Maintain Compatibility with nflverse

- **API Consistency**: Keep interfaces and function signatures consistent with nflreadpy and nflreadr where possible
- **Naming Conventions**: Follow the naming patterns established in the original packages
- **Data Structures**: Maintain compatibility with data formats and return types from the nflverse ecosystem
- **Documentation**: Reference equivalent functions in nflreadpy/nflreadr when documenting

### 2. SOLID Principles

- **Single Responsibility**: Each class/module should have one clear purpose
- **Open/Closed**: Design for extension without modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Many specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

### 3. DRY (Don't Repeat Yourself)

- Extract common logic into reusable functions and utilities
- Use generics to avoid code duplication across similar types
- Create shared type definitions and interfaces
- Centralize configuration and constants

### 4. YAGNI (You Aren't Gonna Need It)

- Only implement features that are currently needed
- Avoid speculative generalization
- Don't add functionality "just in case"
- Keep the codebase lean and focused

## Technical Standards

### TypeScript Best Practices

- **Use Latest Features**: Leverage modern TypeScript features (5.0+)
  - Const type parameters
  - Satisfies operator
  - Template literal types
  - Utility types (Awaited, ReturnType, etc.)

- **Strong Typing**:
  - Avoid `any` - use `unknown` when type is truly unknown
  - Prefer type inference over explicit types where clear
  - Use discriminated unions for complex state management
  - Leverage const assertions and as const

- **Type Safety**:
  - Enable strict mode in tsconfig.json
  - Use readonly where appropriate
  - Prefer immutable patterns

### Performance Priorities

- **Efficiency First**:
  - Profile and optimize hot paths
  - Use appropriate data structures (Map/Set over Object/Array where beneficial)
  - Implement lazy loading and caching strategies
  - Minimize memory allocations in loops

- **Async Operations**:
  - Use Promise.all() for parallel operations
  - Implement proper error handling with try/catch
  - Consider streaming for large datasets
  - Use AbortController for cancellable requests

- **Bundle Size**:
  - Tree-shakeable exports
  - Avoid unnecessary dependencies
  - Use dynamic imports where appropriate

### Code Organization

- **Module Structure**:
  - Group related functionality
  - Clear separation of concerns
  - Logical file and folder naming

- **Naming Conventions**:
  - Use camelCase for variables and functions
  - Use PascalCase for classes and types
  - Use UPPER_SNAKE_CASE for constants
  - Descriptive, self-documenting names

### Testing

- Write tests for all public APIs
- Include edge cases and error conditions
- Test performance-critical code paths
- Maintain high test coverage

### Documentation

- Use JSDoc for all public APIs
- Include usage examples in documentation
- Document performance characteristics where relevant
- Note any deviations from nflreadpy/nflreadr APIs

## Development Workflow

1. **Before Implementation**:
   - Review equivalent functionality in nflreadpy/nflreadr
   - Verify the feature is needed (YAGNI)
   - Consider performance implications

2. **During Implementation**:
   - Follow TypeScript best practices
   - Write clean, readable code
   - Apply SOLID and DRY principles
   - Add appropriate type definitions

3. **After Implementation**:
   - Write comprehensive tests
   - Add documentation
   - Review for performance optimization opportunities
   - Verify API consistency with nflverse packages
   - Update ROADMAP.md

## Common Patterns

### Data Fetching

```typescript
// Use typed responses with proper error handling
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error}`);
  }
}
```

### Type-Safe Configuration

```typescript
// Use const assertions and satisfies for type-safe configs
const config = {
  apiVersion: 'v1',
  timeout: 5000,
  retries: 3,
} as const satisfies Record<string, string | number>;
```

### Performance Optimization

```typescript
// Cache expensive computations
const cache = new Map<string, Result>();

function getOrCompute(key: string, compute: () => Result): Result {
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const result = compute();
  cache.set(key, result);
  return result;
}
```

## Anti-Patterns to Avoid

- ❌ Using `any` without justification
- ❌ Premature optimization or abstraction
- ❌ Ignoring errors or using empty catch blocks
- ❌ Breaking API compatibility with nflverse without good reason
- ❌ Copy-pasting code instead of extracting common logic
- ❌ Adding dependencies for trivial functionality

## Resources

- [nflreadr GitHub](https://github.com/nflverse/nflreadr)
- [nflreadpy GitHub](https://github.com/nflverse/nflreadpy)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)

## Questions?

When in doubt:

1. Check how nflreadpy/nflreadr handles it
2. Prioritize simplicity and performance
3. Follow TypeScript best practices
4. Ask for clarification in issues/discussions
