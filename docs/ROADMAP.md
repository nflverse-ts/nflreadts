# nflreadts Development Roadmap

> **Last Updated**: November 13 2025
> **Status**: Phase 4 Complete - Schedule Data | Phase 5 In Progress - Performance Optimization

This roadmap outlines the development plan for nflreadts, the TypeScript port of nflreadpy/nflreadr.

## Vision

Bring the power of nflverse data tools to the TypeScript/JavaScript ecosystem with a modern, performant, and developer-friendly API.

## Core Principles

- **API Compatibility**: Maintain consistency with nflreadpy/nflreadr where possible
- **Type Safety**: Leverage TypeScript's full type system for excellent DX
- **Performance**: Optimize for speed and minimal bundle size
- **Universal**: Support both Node.js and browser environments
- **Modern**: Use latest TypeScript features and async patterns

---

## NFLVerse TypeScript Ecosystem Architecture

### Overview

nflreadts is part of a larger vision to bring the entire nflverse ecosystem to TypeScript. The architecture is designed for:

- **Package Independence**: Each package works standalone
- **Shared Foundation**: Common types and utilities across all packages
- **Optimal Tree-Shaking**: Users only bundle what they use
- **Umbrella Package**: `@nflverse/complete` for convenience

### Planned Package Structure

```
@nflverse/types         ← Foundation (types + constants only)
├── Season, Week, Team, SeasonType types
├── NFL_TEAMS, MIN_SEASON constants
└── Zero runtime dependencies (TypeScript only)

@nflverse/nflreadts     ← Data Loading (this package)
├── loadRosters, loadPlayers, loadSchedules
├── CSV/Parquet parsing
└── Depends on: @nflverse/types

@nflverse/nflfastr      ← Play-by-Play Analysis (future)
├── EPA calculations, win probability
├── Play-by-play processing
└── Depends on: @nflverse/types

@nflverse/nflseedr      ← Playoff Simulations (future)
├── Seeding calculations
├── Monte Carlo simulations
└── Depends on: @nflverse/types

@nflverse/nfl4th        ← 4th Down Decisions (future)
├── Go-for-it models
├── Decision analytics
└── Depends on: @nflverse/types

@nflverse/complete      ← Umbrella Package (future)
├── Re-exports all packages
├── Convenience imports
└── Optimized for tree-shaking
```

### Why @nflverse/types?

**Decision: Create separate types package FIRST, before other packages**

**Rationale:**

1. **Single Source of Truth** - All packages reference the same `Season` type
2. **No Circular Dependencies** - Types sit at bottom of dependency tree
3. **Zero Bundle Cost** - Pure TypeScript types (0 bytes in JavaScript)
4. **Version Stability** - Type changes = coordinated updates across ecosystem
5. **Package Independence** - nfl4th doesn't need to depend on nflreadts just for types

**Example Impact:**

```typescript
// nflfastr only needs types, not data loading
import type { Season, PlayByPlayRecord } from '@nflverse/types';
// Bundle: ~0KB from @nflverse/types

// vs. if types were in nflreadts
import type { Season } from '@nflverse/nflreadts/types';
// Bundle: Still pulls in some nflreadts infrastructure
```

### Package Boundaries

**@nflverse/types** (1-2KB, types only):

- Core domain types: `Season`, `Week`, `Team`, `SeasonType`
- Constants: `MIN_SEASON`, `NFL_TEAMS`, `HISTORICAL_TEAMS`
- NO validation logic, NO data structures, NO implementations

**@nflverse/nflreadts** (60-70KB):

- Data loading functions
- Validation functions (isValidSeason, isValidTeam, etc.)
- CSV/Parquet parsing
- HTTP client, caching, rate limiting
- Record types (RosterRecord, PlayerRecord, etc.)

**Future packages**: Build on `@nflverse/types`, add specialized functionality

### Bundle Size Targets

| Package             | Minified Size     | Use Case                       |
| ------------------- | ----------------- | ------------------------------ |
| @nflverse/types     | ~0KB (types only) | Type imports                   |
| @nflverse/nflreadts | ~20KB             | Data loading                   |
| @nflverse/nflfastr  | ~15KB             | Analytics                      |
| @nflverse/complete  | ~50-70KB          | Everything (with tree-shaking) |

---

## Phase 0: Foundation ✅ COMPLETE

**Goal**: Set up project infrastructure and development environment

### Tasks

- [x] Create repository structure (src, tests, docs)
- [x] Add LICENSE, README, CONTRIBUTING.md
- [x] Add CLAUDE.md for AI assistant guidance
- [x] Initialize package.json with project metadata
- [x] Set up TypeScript configuration (tsconfig.json)
- [x] Configure build tooling (tsup)
- [x] Set up testing framework (vitest)
- [x] Configure linting (ESLint) and formatting (Prettier)
- [x] Set up CI/CD pipeline (GitHub Actions)
- [x] Create initial project documentation structure
- [x] Set up code coverage reporting (Codecov integration)
- [x] Configure npm publishing workflow
- [x] Publish initial package to npm (v0.0.1)
- [x] Set up automated GitHub release publishing

### Deliverables

- ✅ Functional development environment
- ✅ Build and test scripts
- ✅ Contributing guidelines
- ✅ Basic project documentation
- ✅ VSCode workspace settings
- ✅ Coverage reporting with 80% thresholds
- ✅ npm package published (nflreadts@0.0.3)
- ✅ Automated publishing via GitHub Actions

---

## Phase 1: Core Infrastructure ✅ COMPLETE

**Goal**: Build foundational utilities and types that all features will depend on

### 1.1 Type Definitions ✅

- [x] Create core NFL data types (Season, Week, Team, etc.)
- [x] Define common interface patterns
- [x] Set up utility types for API responses
- [x] Create discriminated unions for data states
- [x] Define error types and result types

### 1.2 HTTP Client Layer ✅

- [x] Implement flexible HTTP client abstraction
  - Node.js support (ky with native fetch)
  - Browser support (ky with native fetch)
  - Configurable timeout and retry logic
- [x] Add request caching mechanism (ResponseCache)
- [x] Add comprehensive error handling (NetworkError, TimeoutError, RequestAbortedError)
- [x] Implement rate limiting (RateLimiter with token bucket algorithm)
- [x] Support AbortController for cancellation (signal parameter in RequestOptions)

### 1.3 Utilities ✅

- [x] Data validation utilities (validation.ts)
- [x] Date/time helpers (datetime.ts - season/week calculations)
- [x] URL builders for nflverse endpoints (url.ts)
- [x] CSV parsing utilities (parse.ts with papaparse)
- [x] Parquet parsing utilities (parse.ts with hyparquet)
- [x] Caching layer (memory via ResponseCache)
- [x] Logging utilities (logger.ts - configurable)

### 1.4 Configuration ✅

- [x] Centralized configuration system (ConfigManager)
- [x] Environment-aware defaults (detectEnvironment)
- [x] User-configurable options (cache, timeouts, etc.)

### Phase 1 Deliverables ✅

- ✅ Comprehensive type definitions (types/common.d.ts, team.ts, player.d.ts, error.ts, utils.ts)
- ✅ Tested HTTP client (client/client.ts, client/cache.ts)
- ✅ Utility library (utils/validation.ts, datetime.ts, url.ts, parse.ts, logger.ts)
- ✅ Configuration system (config/manager.ts, defaults.ts, env.ts)
- ✅ 16 test files covering all core functionality

---

## Phase 2: Data Loading - Play-by-Play Data ✅ COMPLETE

**Goal**: Implement core play-by-play data loading functionality

### 2.1 Load Play-by-Play (PBP) ✅

Reference: `nflreadr::load_pbp()` / `nflreadpy.load_pbp()`

- [x] Implement `loadPbp()` function
  - Support single season loading
  - Support multiple seasons (parallel fetching)
  - Type-safe return values
  - CSV and Parquet format support
- [x] Basic performance optimizations
  - Single HttpClient instance reuse
  - Optimized array concatenation
  - Pre-allocated array generation
- [x] Implement data validation (season validation)
- [x] Add caching support (via HttpClient)
- [x] Write comprehensive tests (15 test cases)
- [x] Document API with examples

### 2.2 Participation Data ✅

Reference: `nflreadr::load_participation()`

- [x] Implement `loadParticipation()` function
- [x] Add type definitions for participation data
- [x] Write tests
- [x] Document API
- [x] Support 2016+ data (when participation tracking began)

### 2.3 Player Stats ✅

Reference: `nflreadr::load_player_stats()`

- [x] Implement `loadPlayerStats()` function
- [x] Support different stat types (offense, defense, kicking)
- [x] Add aggregation options (week, reg, post, reg+post)
- [x] Refactor aggregation logic with DRY principles
- [x] Write tests
- [x] Document API

### Phase 2 Deliverables ✅

- ✅ Working PBP data loading with `loadPbp()`
- ✅ PlayByPlayRecord type with 100+ fields
- ✅ CSV and Parquet format support
- ✅ Comprehensive tests (15+ test cases per module)
- ✅ Player stats functionality with aggregation
- ✅ Participation data loading (2016+)
- ✅ DRY refactoring of repetitive aggregation code
- ✅ Centralized season normalization utility

---

## Phase 3: Roster and Player Data ✅ COMPLETE

**Goal**: Implement roster and player information functionality

### 3.1 Rosters ✅

Reference: `nflreadr::load_rosters()`

- [x] Implement `loadRosters()` function
- [x] Support single/multiple seasons
- [x] Add player filtering
- [x] Write tests
- [x] Document API

### 3.2 Players ✅

Reference: `nflreadr::load_players()`

- [x] Implement `loadPlayers()` function
- [x] Add comprehensive player information types
- [x] Support search/filter functionality
- [x] Write tests
- [x] Document API

### 3.3 Depth Charts ✅

Reference: `nflreadr::load_depth_charts()`

- [x] Implement `loadDepthCharts()` function
- [x] Add depth chart types
- [x] Write tests
- [x] Document API

### Phase 3 Deliverables ✅

- ✅ Roster loading functionality (`loadRosters()`)
- ✅ RosterRecord type with 36 fields (season, team, position, player info, IDs, etc.)
- ✅ Player data access (`loadPlayers()`)
- ✅ PlayerRecord type with comprehensive player information
- ✅ Depth chart data (`loadDepthCharts()`)
- ✅ DepthChartRecord type with position hierarchy (2001+)
- ✅ CSV and Parquet format support for all functions
- ✅ Comprehensive tests with >80% coverage
- ✅ Complete API documentation

---

## Phase 4: Schedule and Game Data ✅ COMPLETE (Partial)

**Goal**: Implement schedule and game-related functionality

### 4.1 Schedules ✅

Reference: `nflreadr::load_schedules()`

- [x] Implement `loadSchedules()` function
- [x] Support filtering by season/week/team (via returned data)
- [x] Add game status information (46 fields including scores, betting lines, weather)
- [x] Write tests (15+ comprehensive test cases)
- [x] Document API (JSDoc with examples)

### 4.2 Team Descriptions ✅

Reference: `nflreadr::load_teams()`

- [x] Implement `loadTeams()` function
- [x] Add comprehensive team metadata (16 fields with colors, logos, IDs)
- [x] Support historical team data (`current` option for filtering)
- [x] Write tests (12+ comprehensive test cases)
- [x] Document API (JSDoc with examples)

### 4.3 Standings ⏸️ DEFERRED

**Note**: `nflreadr` does not have a `load_standings()` function. Standings are calculated
using `nflseedR::nfl_standings()` from schedule data. This will be implemented as a utility
function in a future phase.

- [ ] Implement `calculateStandings()` utility function
- [ ] Add division/conference filtering
- [ ] Calculate playoff implications
- [ ] Write tests
- [ ] Document API

### Phase 4 Deliverables ✅

- ✅ Schedule loading functionality (`loadSchedules()`)
- ✅ ScheduleRecord type with 46 fields (game info, scores, betting lines, weather, IDs)
- ✅ Team information loading (`loadTeams()`)
- ✅ TeamRecord type with 16 fields (metadata, colors, logos)
- ✅ CSV and Parquet format support for both functions
- ✅ Comprehensive tests with >80% coverage
- ✅ Complete API documentation with examples
- ⏸️ Standings data (deferred to utility function)

---

## Phase 5: Advanced Statistics

**Goal**: Implement advanced metrics and analytics

### 5.1 Next Gen Stats

Reference: `nflreadr::load_nextgen_stats()`

- [ ] Implement `loadNextGenStats()` function
- [ ] Support different NGS stat types
- [ ] Add proper typing for stat categories
- [ ] Write tests
- [ ] Document API

### 5.2 ESPN QBR

- [ ] Implement `loadQbr()` function
- [ ] Support seasonal/weekly QBR
- [ ] Write tests
- [ ] Document API

### 5.3 Advanced Metrics

- [ ] Implement `loadPfr()` (Pro Football Reference data)
- [ ] Add snap counts
- [ ] Add any other advanced stats from nflverse
- [ ] Write tests
- [ ] Document API

### Deliverables

- NGS data loading
- QBR functionality
- Advanced metrics
- Tests and documentation

---

## Phase 6: Betting and Fantasy

**Goal**: Implement betting lines and fantasy-related functionality

### 6.1 Betting Lines

Reference: `nflreadr::load_officials()`, betting data

- [ ] Implement `loadLines()` function
- [ ] Support multiple betting markets
- [ ] Add historical line movement
- [ ] Write tests
- [ ] Document API

### 6.2 Fantasy Data

- [ ] Implement fantasy projections loading
- [ ] Add scoring calculations
- [ ] Support different scoring formats
- [ ] Write tests
- [ ] Document API

### Deliverables

- Betting lines functionality
- Fantasy data access
- Tests and documentation

---

## Phase 7: Contracts and Draft

**Goal**: Implement contract and draft data

### 7.1 Contracts

Reference: `nflreadr::load_contracts()`

- [ ] Implement `loadContracts()` function
- [ ] Add contract type definitions
- [ ] Support filtering and aggregation
- [ ] Write tests
- [ ] Document API

### 7.2 Draft Picks

Reference: `nflreadr::load_draft_picks()`

- [ ] Implement `loadDraftPicks()` function
- [ ] Add draft pick types
- [ ] Support historical draft data
- [ ] Write tests
- [ ] Document API

### Deliverables

- Contract data loading
- Draft pick functionality
- Tests and documentation

---

## Phase 8: Optimization and Polish 🔄 IN PROGRESS

**Goal**: Optimize performance, developer experience, and prepare for ecosystem

### 8.0 Types Package Extraction 🔄 IN PROGRESS

**Goal**: Extract shared types to @nflverse/types package

- [x] Document ecosystem architecture in ROADMAP
- [ ] Create @nflverse/types package repository
- [ ] Extract core types from nflreadts
  - [ ] Season, Week, Team, SeasonType
  - [ ] Constants: MIN_SEASON, NFL_TEAMS, HISTORICAL_TEAMS
  - [ ] Team abbreviations and mappings
- [ ] Publish @nflverse/types@0.1.0
- [ ] Update nflreadts to depend on @nflverse/types
- [ ] Verify zero runtime bundle cost for type imports
- [ ] Document type-only import patterns

**Why now**: Establishing the foundation before building nflfastr ensures clean architecture from the start.

### 8.1 Performance ✅ PARTIALLY COMPLETE

- [x] Remove module-level side effects (lazy logger initialization)
- [x] Add `sideEffects: false` to package.json
- [x] Enable code splitting in build config
- [x] Reduce bundle size (22.7KB → 20.1KB minified, ~12% reduction)
- [ ] Profile and optimize hot paths
- [ ] Advanced data loading optimizations
  - [ ] Streaming parsers for large files (GB+ datasets)
  - [ ] Worker thread support for parallel parsing (offload CPU)
  - [ ] Progressive loading with callbacks/generators
  - [ ] Column selection to load only needed fields
  - [ ] Compression support (gzip transfer encoding)
  - [ ] Request batching and connection pooling enhancements
  - [ ] Memory-efficient parsing for large multi-season loads
- [ ] Further optimize bundle size
  - [x] Tree-shaking optimization (lazy loggers)
  - [ ] Subpath exports for fine-grained imports
  - [ ] Optional dependencies for Parquet support
- [ ] Add lazy loading where appropriate
- [ ] Benchmark against nflreadpy/nflreadr
  - [ ] Compare load times across different data sizes
  - [ ] Memory usage profiling
  - [ ] Bundle size comparison

### 8.2 Developer Experience

- [ ] Add helpful error messages
- [ ] Improve TypeScript intellisense
- [ ] Create interactive examples
- [ ] Add migration guide from other nflverse packages
- [ ] Create code snippets for popular editors

### 8.3 Documentation

- [ ] Complete API reference
- [ ] Add tutorial documentation
- [ ] Create example projects
- [ ] Add cookbook for common tasks
- [ ] Set up documentation site

### 8.4 Testing

- [ ] Achieve >90% code coverage
- [ ] Add integration tests
- [ ] Add performance regression tests
- [ ] Test browser compatibility
- [ ] Test Node.js version compatibility

### Deliverables

- Optimized, production-ready library
- Comprehensive documentation
- Example projects
- High test coverage

---

## Phase 9: Release

**Goal**: Prepare for and execute initial release

### 9.1 Pre-Release

- [ ] Security audit
- [ ] License compliance check
- [ ] Final API review with nflverse team
- [ ] Create changelog
- [ ] Version 1.0.0-beta release

### 9.2 Release

- [ ] Publish to npm
- [ ] Announce on social media / nflverse channels
- [ ] Update nflverse documentation
- [ ] Create release notes
- [ ] Version 1.0.0 stable release

### 9.3 Post-Release

- [ ] Monitor issues and feedback
- [ ] Address critical bugs quickly
- [ ] Plan future enhancements
- [ ] Build community

### Deliverables

- Published npm package
- Release announcement
- Community engagement

---

## Phase 10: Future Enhancements

**Goal**: Continuous improvement and feature additions

### Potential Features

- [ ] GraphQL API wrapper
- [ ] React hooks package (`@nflreadts/react`)
- [ ] CLI tool for data exploration
- [ ] Data visualization utilities
- [ ] Machine learning helpers
- [ ] Additional data sources integration
- [ ] WebSocket support for live data
- [ ] Offline-first capabilities
- [ ] Database integration helpers

---

## Notes

- Each phase should be completed before moving to the next
- Maintain backward compatibility with previous phases
- Continuously reference nflreadpy/nflreadr for API decisions
- Regular check-ins with nflverse team for alignment
- Follow semantic versioning strictly
- Keep bundle size and performance in mind at every step

---

## Recent Updates

### November 13 2025 - v0.3.x - Ecosystem Architecture & Performance

- 📐 **NFLVerse TypeScript Ecosystem Architecture Defined**
  - Documented vision for @nflverse/types, @nflverse/nflfast-ts, @nflverse/nflseed-ts, @nflverse/nfl4th-ts
  - Decided to create @nflverse/types as foundation package (types + constants only)
  - Established package boundaries and dependency structure
  - Defined bundle size targets for ecosystem

- ⚡ **Performance & Tree-Shaking Improvements**
  - Removed module-level side effects (lazy logger initialization)
  - Added `sideEffects: false` to package.json for better tree-shaking
  - Enabled code splitting in tsup configuration
  - Reduced minified bundle size: 22.7KB → 20.1KB (~12% reduction)
  - Fixed all data loader files: rosters, schedules, teams, players, depth-charts, pbp, participation, player-stats

- 🎯 **Next Steps**
  - Create @nflverse/types package
  - Extract core types and constants
  - Update nflreadts to depend on @nflverse/types

### October 28 2025 - v0.3.0

- ✅ **Completed Phase 3: Roster and Player Data**
  - `loadRosters()` - Season-level roster data (1920-present)
  - `loadPlayers()` - All-time player database with comprehensive info
  - `loadDepthCharts()` - Weekly depth charts showing position rankings (2001+)
  - RosterRecord type with 36 fields (season, team, position, player info, IDs)
  - PlayerRecord type with birth info, draft data, college, status
  - DepthChartRecord type with position hierarchy and ranking
  - CSV and Parquet format support for all functions
  - Comprehensive tests with >80% coverage

- 🔧 **Code Quality & Architecture Improvements**
  - Refactored public API exports - reduced from ~150 exports to ~30 essential ones
  - Shrunk internal module exports (config, types, utils) to only public-facing APIs
  - Removed src/utils/index.ts (all internal utilities now imported directly)
  - Better separation of public vs internal APIs
  - Improved tree-shaking and bundle size optimization
  - Disabled non-null assertion ESLint warnings
  - Fixed depth chart test suite (Date parsing from CSV dynamic typing)

- 📝 **Documentation**
  - Marked Phase 3 as complete in ROADMAP
  - Updated status to reflect Phase 3 completion
  - Added comprehensive deliverables for Phase 3

### October 27 2025 - v0.2.0

- ✅ **Completed Phase 2: Data Loading**
  - `loadPbp()` - Play-by-play data with full season support
  - `loadPlayerStats()` - Player statistics with 4 aggregation levels (week, reg, post, reg+post)
  - `loadParticipation()` - Snap count and participation data (2016+)
  - CSV and Parquet format support across all functions
  - Basic performance optimizations (HttpClient reuse, optimized array operations)
  - 15+ comprehensive test cases per module
  - Type-safe records with 100+ typed fields

- 🔧 **Code Quality Improvements**
  - Refactored player stats aggregation using DRY principles (89 lines → 6 lines)
  - Consolidated duplicate `getCurrentSeason()` function from validation.ts to datetime.ts
  - Cleaned up season normalization logic with ternary operators
  - Fixed TypeScript strict mode compliance
  - Disabled import order lint rules
  - Created centralized `normalizeSeasons()` utility

- 📝 **Documentation**
  - Updated README with usage examples
  - Marked Phase 2 as complete in ROADMAP
  - Added API examples for all data loading functions

---

**Last Updated**: October 28, 2025
