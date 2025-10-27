# nflreadts Development Roadmap

> **Last Updated**: October 27 2025
> **Status**: Phase 2 Complete - Data Loading (PBP, Participation, Player Stats)

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

## Phase 3: Roster and Player Data

**Goal**: Implement roster and player information functionality

### 3.1 Rosters

Reference: `nflreadr::load_rosters()`

- [ ] Implement `loadRosters()` function
- [ ] Support single/multiple seasons
- [ ] Add player filtering
- [ ] Write tests
- [ ] Document API

### 3.2 Players

Reference: `nflreadr::load_players()`

- [ ] Implement `loadPlayers()` function
- [ ] Add comprehensive player information types
- [ ] Support search/filter functionality
- [ ] Write tests
- [ ] Document API

### 3.3 Depth Charts

Reference: `nflreadr::load_depth_charts()`

- [ ] Implement `loadDepthCharts()` function
- [ ] Add depth chart types
- [ ] Write tests
- [ ] Document API

### Deliverables

- Roster loading functionality
- Player data access
- Depth chart data
- Tests and documentation

---

## Phase 4: Schedule and Game Data

**Goal**: Implement schedule and game-related functionality

### 4.1 Schedules

Reference: `nflreadr::load_schedules()`

- [ ] Implement `loadSchedules()` function
- [ ] Support filtering by season/week/team
- [ ] Add game status information
- [ ] Write tests
- [ ] Document API

### 4.2 Team Descriptions

Reference: `nflreadr::load_teams()`

- [ ] Implement `loadTeams()` function
- [ ] Add comprehensive team metadata
- [ ] Support historical team data
- [ ] Write tests
- [ ] Document API

### 4.3 Standings

- [ ] Implement `loadStandings()` function
- [ ] Add division/conference filtering
- [ ] Calculate playoff implications
- [ ] Write tests
- [ ] Document API

### Deliverables

- Schedule loading
- Team information
- Standings data
- Tests and documentation

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

## Phase 8: Optimization and Polish

**Goal**: Optimize performance and developer experience

### 8.1 Performance

- [ ] Profile and optimize hot paths
- [ ] Advanced data loading optimizations
  - [ ] Streaming parsers for large files (GB+ datasets)
  - [ ] Worker thread support for parallel parsing (offload CPU)
  - [ ] Progressive loading with callbacks/generators
  - [ ] Column selection to load only needed fields
  - [ ] Compression support (gzip transfer encoding)
  - [ ] Request batching and connection pooling enhancements
  - [ ] Memory-efficient parsing for large multi-season loads
- [ ] Optimize bundle size
  - [ ] Tree-shaking optimization
  - [ ] Code splitting for data loading functions
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

- [ ] Real-time game data (if available)
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

## Success Metrics

### Technical

- Build time < 5 seconds
- Test suite runs < 30 seconds
- Bundle size < 50KB (minified + gzipped) for core
- Type coverage > 95%
- Code coverage > 90%

### Community

- > 100 GitHub stars in first 6 months
- Active community contributions
- Positive feedback from nflverse team
- Adoption by TypeScript/JS NFL data projects

### Quality

- Zero critical bugs in production
- API stability (no breaking changes in minor versions)
- Comprehensive documentation
- Fast issue response time (< 48 hours)

---

## Dependencies to Research

### Required

- TypeScript 5.0+
- Node.js 18+ / Modern browsers
- Fetch API (native or polyfill)

### Build Tools

- tsup / rollup / esbuild (TBD)
- vitest (testing)
- eslint + prettier (linting/formatting)

### Optional

- papaparse (CSV parsing)
- parquet-js (Parquet file support)
- zod (runtime validation)
- cache manager (advanced caching)

---

## Notes

- Each phase should be completed before moving to the next
- Maintain backward compatibility with previous phases
- Continuously reference nflreadpy/nflreadr for API decisions
- Regular check-ins with nflverse team for alignment
- Follow semantic versioning strictly
- Keep bundle size and performance in mind at every step

---

## Questions & Decisions

Track major architectural decisions here:

1. **Data Format**: CSV vs Parquet vs JSON?
   - Decision: TBD - research nflverse current formats

2. **Caching Strategy**: Memory only vs persistent?
   - Decision: TBD - start with memory, add persistent optionally

3. **Module System**: ESM only vs ESM + CJS?
   - Decision: TBD - likely dual package for maximum compatibility

4. **Browser Support**: Which browsers to support?
   - Decision: TBD - likely modern browsers with native fetch

---

## Recent Updates

### January 2025 - v0.2.0

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

**Last Updated**: January 2025
