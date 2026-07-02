# @nflverse/nflreadts

## 0.6.0

### Minor Changes

- b7e2556: Export the datetime utilities from the package entry point. `getCurrentSeason()`, `getSeasonFromDate()`, `getSeasonFlipDate()` (the Wednesday-after-Labor-Day flip), `getCurrentWeek()`, season/week range generators, and the date helpers are now part of the public API, plus a `mostRecentSeason` alias matching nflreadr's `most_recent_season()`. Previously these existed internally but were not exported, forcing consumers to reimplement the season flip rule.

## 0.5.0

### Minor Changes

- 4bb28d5: Parquet-first defaults, current-generation schemas, and the shared types foundation.
  - **Parquet is now the default format** for all nflverse-data loaders, matching nflreadpy. Pass `{ format: 'csv' }` to keep the old behavior. Companion-source loaders (DynastyProcess, ffopportunity) keep their fixed upstream formats.
  - **`PlayerRecord` regenerated for players v2** (nflverse rebuild, Sept 2025) and **`DepthChartRecord` regenerated for the date-level, ESPN-sourced depth charts** — both derived from the live assets.
  - **Season detection now flips on the Wednesday after Labor Day**, matching nflreadr's `most_recent_season()`. New `getSeasonFlipDate()` utility exported.
  - **`@nflverse/types` is now the foundation dependency**: core types (`Season`, `Week`, `SeasonType`, `Position`, ...) and shared constants (`NFL_TEAMS`, `MIN_SEASON`, ...) are re-exported from the shared package, so all nflverse TypeScript packages agree on one definition. No import changes needed.

## 0.4.0

### Minor Changes

- b023183: Full loader parity with nflreadpy: 16 new data loaders, all live-verified against current assets.

  New nflverse-data loaders: `loadTeamStats` (summary levels like player stats), `loadRostersWeekly` (2002+), `loadInjuries` (2009+), `loadSnapCounts` (2012+), `loadFtnCharting` (2022+, FTN Data via nflverse, CC-BY-SA 4.0), `loadDraftPicks` (1980+), `loadCombine` (2000+), `loadContracts` (OTC; parquet default, no csv upstream), `loadOfficials` (2015+), `loadTrades` (2002+), `loadNextgenStats` (2016+, one file per stat type, parquet-only upstream), `loadPfrAdvstats` (2018+, week/season levels x pass/rush/rec/def).

  New companion-source loaders: `loadFfPlayerids` (DynastyProcess ID crosswalk), `loadFfRankings` (FantasyPros via DynastyProcess; draft/week/all), `loadFfOpportunity` (ffverse expected fantasy points; weekly/pbp_pass/pbp_rush, latest/v1.0.0).

  Also: shared loader internals replace per-loader HTTP/parse boilerplate, and a scheduled live-canary workflow now runs every loader against real assets twice a week so upstream drift can never hide behind mocked tests again.

- 76b8457: Repoint all loaders at current nflverse-data assets (live-verified against the 2025 nflverse reorganization):
  - `loadPlayerStats` now reads the `stats_player` release; `summaryLevel` selects the pre-aggregated file (`week`/`reg`/`post`/`reg+post`) and client-side aggregation was removed. `PlayerStatsRecord` matches the live 115-column schema (renames: `passing_interceptions`, `sacks_suffered`, `sack_yards_lost`; new: `passing_cpoe`, `wopr`, return/penalty/gwfg fields, and more).
  - `loadSchedules` fetches the single all-seasons `games` file and filters requested seasons (per-season `sched_{year}` assets never existed).
  - `loadTeams` reads `teams_colors_logos`; `current: true` keeps the 32 active franchise abbreviations.
  - `loadParticipation` reads the `pbp_participation` release and caps availability at the most recently completed season (FTN delivers after each postseason).
  - `buildWeeklyRosterUrl` points at the `weekly_rosters` release tag.
  - New `buildTeamStatsUrl` for the `stats_team` release.
