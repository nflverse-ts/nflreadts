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

Current Phase: **Phase 3 Complete - Roster and Player Data**

## Features

### ✅ Available Now

**Data Loading Functions:**

- **Play-by-Play Data**: Load comprehensive NFL play-by-play data with `loadPbp()`
- **Player Statistics**: Load player stats with aggregation support via `loadPlayerStats()`
- **Participation Data**: Load snap count and participation data with `loadParticipation()` (2016+)
- **Rosters**: Load season-level roster information with `loadRosters()` (1920-present)
- **Players**: Load all-time player database with `loadPlayers()`
- **Depth Charts**: Load weekly depth charts with position rankings via `loadDepthCharts()` (2001+)

**Features:**

- **Multiple Formats**: Support for both CSV and Parquet file formats
- **Full TypeScript Support**: Comprehensive type definitions with 100+ typed fields
- **Promise-based API**: Modern async/await workflows
- **Smart Caching**: Built-in HTTP caching for improved performance
- **Rate Limiting**: Automatic rate limiting to respect data source limits
- **Browser and Node.js**: Universal compatibility
- **Minimal API Surface**: Clean exports with excellent tree-shaking

### 🚧 Planned

- Team schedules and game results
- Advanced statistics (Next Gen Stats, QBR)
- Betting lines and fantasy data
- Contract and draft information

## Installation

> **Note:** Package is available on npm but in alpha stage

```bash
npm install @nflverse/nflreadts
```

## Usage

```typescript
import {
  loadPbp,
  loadPlayerStats,
  loadParticipation,
  loadRosters,
  loadPlayers,
  loadDepthCharts
} from '@nflverse/nflreadts';

// Load play-by-play data for 2023 season
const plays = await loadPbp(2023);
console.log(`Loaded ${plays.length} plays`);

// Load player stats with weekly breakdown
const weeklyStats = await loadPlayerStats(2023, { summaryLevel: 'week' });

// Load player stats aggregated for regular season
const regStats = await loadPlayerStats(2023, { summaryLevel: 'reg' });

// Load participation/snap count data (2016+)
const participation = await loadParticipation(2023);

// Load season rosters (1920+)
const rosters = await loadRosters(2023);
console.log(`Loaded ${rosters.length} roster entries`);

// Load all-time player database
const players = await loadPlayers();
console.log(`Loaded ${players.length} players`);

// Load weekly depth charts (2001+)
const depthCharts = await loadDepthCharts(2023);

// Load multiple seasons in parallel
const multiSeasonPbp = await loadPbp([2022, 2023]);
const multiSeasonRosters = await loadRosters([2022, 2023]);

// Load all available seasons
const allPbp = await loadPbp(true);

// Use Parquet format for better performance
const parquetPbp = await loadPbp(2023, { format: 'parquet' });
const parquetRosters = await loadRosters(2023, { format: 'parquet' });
```

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
