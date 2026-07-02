# nflreadts

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/nflverse-ts/nflreadts/workflows/CI/badge.svg)](https://github.com/nflverse-ts/nflreadts/actions)
[![codecov](https://codecov.io/gh/nflverse-ts/nflreadts/branch/main/graph/badge.svg)](https://codecov.io/gh/nflverse-ts/nflreadts)
[![npm version](https://img.shields.io/npm/v/@nflverse/nflreadts.svg)](https://www.npmjs.com/package/@nflverse/nflreadts)

The TypeScript port of the [nflreadpy](https://github.com/nflverse/nflreadpy)/[nflreadr](https://github.com/nflverse/nflreadr) packages from the [nflverse](https://github.com/nflverse) team.

## Overview

nflreadts brings the power of nflverse data tools to the TypeScript/JavaScript ecosystem, enabling developers to easily access and work with NFL data in Node.js and browser environments.

## ⚠️ Status: Alpha / Work in Progress

**This package is currently in active development and not yet ready for production use.**

- Version 0.x.x indicates pre-release status
- APIs may change without notice
- Features are being implemented incrementally (see [ROADMAP](docs/ROADMAP.md))
- Early adopters and contributors are welcome!

Current Phase: **Full loader parity with nflreadpy** (24 loaders, live-verified twice weekly by a scheduled canary)

## Features

### ✅ Data loading functions

**Core:**

- `loadPbp()` - play-by-play (1999+)
- `loadPlayerStats()` / `loadTeamStats()` - player/team stats with summary levels (week, reg, post, reg+post)
- `loadSchedules()` - games and results (1999+)
- `loadTeams()` - team metadata, colors, logos
- `loadPlayers()` - all-time player database
- `loadRosters()` (1920+) / `loadRostersWeekly()` (2002+)
- `loadDepthCharts()` (2001+)
- `loadParticipation()` - play participation (2016+; FTN Data via nflverse for 2023+, CC-BY-SA 4.0)

**Advanced stats:**

- `loadNextgenStats()` - NGS passing/receiving/rushing (2016+)
- `loadPfrAdvstats()` - PFR advanced stats, week/season levels (2018+)
- `loadSnapCounts()` (2012+)
- `loadFtnCharting()` - FTN charting (2022+)
- `loadInjuries()` - injury reports (2009+)

**League business:**

- `loadDraftPicks()` (1980+), `loadCombine()` (2000+)
- `loadContracts()` - OTC historical contracts
- `loadOfficials()` (2015+), `loadTrades()` (2002+)

**Fantasy (companion sources):**

- `loadFfPlayerids()` - DynastyProcess ID crosswalk
- `loadFfRankings()` - FantasyPros rankings (draft/week/all)
- `loadFfOpportunity()` - ffverse expected fantasy points (2006+)

**Package features:**

- **Multiple Formats**: CSV and Parquet (some upstream assets are parquet-only; loaders default accordingly)
- **Full TypeScript Support**: typed records derived from the live data schemas
- **Promise-based API**: modern async/await workflows with Result-typed error handling
- **Smart Caching**: built-in HTTP caching for improved performance
- **Rate Limiting**: automatic rate limiting to respect data source limits
- **Browser and Node.js**: universal compatibility
- **Live canary CI**: every loader runs against real nflverse assets twice a week

## Installation

> **Note:** Package is available on npm but in alpha stage

```bash
npm install @nflverse/nflreadts
```

## Usage

### Basic Usage

All data loading functions return a `Result<T, Error>` type for safe, functional error handling:

```typescript
import {
  loadPbp,
  loadPlayerStats,
  loadParticipation,
  loadRosters,
  loadPlayers,
  loadDepthCharts,
  loadSchedules,
  loadTeams,
} from '@nflverse/nflreadts';

// Load play-by-play data for 2023 season
const pbpResult = await loadPbp(2023);
if (pbpResult.ok) {
  console.log(`Loaded ${pbpResult.value.length} plays`);
} else {
  console.error('Failed to load PBP data:', pbpResult.error);
}

// Load schedules
const schedResult = await loadSchedules(2023);
if (schedResult.ok) {
  console.log(`Loaded ${schedResult.value.length} games`);
}

// Load teams
const teamsResult = await loadTeams();
if (teamsResult.ok) {
  console.log(`Loaded ${teamsResult.value.length} teams`);
}

// Load season rosters (1920+)
const rostersResult = await loadRosters(2023);
if (rostersResult.ok) {
  console.log(`Loaded ${rostersResult.value.length} roster entries`);
}

// Load all-time player database
const playersResult = await loadPlayers();
if (playersResult.ok) {
  console.log(`Loaded ${playersResult.value.length} players`);
}

// Load weekly depth charts (2001+)
const depthResult = await loadDepthCharts(2023);
if (depthResult.ok) {
  console.log(`Loaded ${depthResult.value.length} depth chart entries`);
}
```

### Advanced Error Handling

```typescript
import { loadRosters, unwrap, unwrapOr, isOk } from '@nflverse/nflreadts';

// Using unwrap (throws if error)
const rosters = unwrap(await loadRosters(2023));

// Using unwrapOr (provides default value)
const rosters = unwrapOr(await loadRosters(2023), []);

// Using type guards
const result = await loadRosters(2023);
if (isOk(result)) {
  // TypeScript knows result.value is available
  console.log(result.value.length);
}
```

### Multiple Seasons and Formats

```typescript
// Load multiple seasons in parallel
const multiSeasonResult = await loadRosters([2022, 2023]);
if (multiSeasonResult.ok) {
  console.log(`Loaded ${multiSeasonResult.value.length} total roster entries`);
}

// Load all available seasons
const allPbpResult = await loadPbp(true);

// Use Parquet format for better performance
const parquetResult = await loadRosters(2023, { format: 'parquet' });
```

### Player Stats and Participation

```typescript
// Load player stats with weekly breakdown
const weeklyStatsResult = await loadPlayerStats(2023, { summaryLevel: 'week' });

// Load player stats aggregated for regular season
const regStatsResult = await loadPlayerStats(2023, { summaryLevel: 'reg' });

// Load participation/snap count data (2016+)
const participationResult = await loadParticipation(2023);
```

### Input Validation

nflreadts provides comprehensive input validation to catch errors early and provide clear feedback:

```typescript
import {
  validateSeason,
  validateWeek,
  validateTeam,
  validateSeasons,
  assertValidSeason,
} from '@nflverse/nflreadts';

// Validate with type coercion (accepts strings or numbers)
const seasonResult = validateSeason('2023', { coerce: true });
if (seasonResult.valid) {
  console.log(`Season ${seasonResult.value} is valid`);
} else {
  console.error(seasonResult.error?.message);
  // "Invalid season: 1990. Must be between 1999 and 2025"
}

// Validate week by season type
const weekResult = validateWeek(19, { seasonType: 'POST' }); // Playoffs
if (weekResult.valid) {
  console.log(`Week ${weekResult.value} is valid for POST season`);
}

// Validate and normalize team abbreviations
const teamResult = validateTeam('kc', { normalize: true });
// teamResult.value === 'KC'

// Validate multiple values at once
const seasonsResult = validateSeasons(['2020', '2021', '2022'], { coerce: true });
if (seasonsResult.valid) {
  await loadSchedules(seasonsResult.value);
}

// Assert validation (throws on invalid input)
try {
  assertValidSeason(1990); // Throws ValidationError
} catch (error) {
  console.error(error.message);
  console.error(error.context); // { season: 1990, minSeason: 1999, maxSeason: 2025 }
}
```

**Validation Rules:**

- **Seasons**: Must be 1999-present (+1 for scheduling)
- **Weeks**:
  - Regular season (REG): 1-18
  - Postseason (POST): 19-22
  - Preseason (PRE): 1-4
- **Teams**: Must be valid current or historical NFL team abbreviations
- **Formats**: Must be one of: csv, parquet, json, rds

All data loaders automatically validate inputs before making API calls. For detailed validation documentation, see the [Validation Guide](docs/VALIDATION.md).

For more examples and detailed documentation, see the [API documentation](docs/) (coming soon).

## Related Projects

This project is part of the nflverse ecosystem:

- [nflreadr](https://github.com/nflverse/nflreadr) - R package for NFL data
- [nflreadpy](https://github.com/nflverse/nflreadpy) - Python package for NFL data
- [nflverse](https://github.com/nflverse) - The complete nflverse organization

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project is developed with approval from the nflverse team. Special thanks to the maintainers of nflreadr and nflreadpy for their foundational work.

## Contact

- **Issues**: Please report bugs and feature requests via [GitHub Issues](https://github.com/YOUR_USERNAME/nflreadts/issues)
- **Discussions**: For questions and community discussion, use [GitHub Discussions](https://github.com/YOUR_USERNAME/nflreadts/discussions)

---

Built with ❤️ for the NFL data community
