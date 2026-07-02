---
'@nflverse/nflreadts': minor
---

Parquet-first defaults, current-generation schemas, and the shared types foundation.

- **Parquet is now the default format** for all nflverse-data loaders, matching nflreadpy. Pass `{ format: 'csv' }` to keep the old behavior. Companion-source loaders (DynastyProcess, ffopportunity) keep their fixed upstream formats.
- **`PlayerRecord` regenerated for players v2** (nflverse rebuild, Sept 2025) and **`DepthChartRecord` regenerated for the date-level, ESPN-sourced depth charts** — both derived from the live assets.
- **Season detection now flips on the Wednesday after Labor Day**, matching nflreadr's `most_recent_season()`. New `getSeasonFlipDate()` utility exported.
- **`@nflverse/types` is now the foundation dependency**: core types (`Season`, `Week`, `SeasonType`, `Position`, ...) and shared constants (`NFL_TEAMS`, `MIN_SEASON`, ...) are re-exported from the shared package, so all nflverse TypeScript packages agree on one definition. No import changes needed.
