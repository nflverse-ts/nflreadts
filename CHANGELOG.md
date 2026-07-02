# @nflverse/nflreadts

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
