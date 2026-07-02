---
'@nflverse/nflreadts': minor
---

Full loader parity with nflreadpy: 16 new data loaders, all live-verified against current assets.

New nflverse-data loaders: `loadTeamStats` (summary levels like player stats), `loadRostersWeekly` (2002+), `loadInjuries` (2009+), `loadSnapCounts` (2012+), `loadFtnCharting` (2022+, FTN Data via nflverse, CC-BY-SA 4.0), `loadDraftPicks` (1980+), `loadCombine` (2000+), `loadContracts` (OTC; parquet default, no csv upstream), `loadOfficials` (2015+), `loadTrades` (2002+), `loadNextgenStats` (2016+, one file per stat type, parquet-only upstream), `loadPfrAdvstats` (2018+, week/season levels x pass/rush/rec/def).

New companion-source loaders: `loadFfPlayerids` (DynastyProcess ID crosswalk), `loadFfRankings` (FantasyPros via DynastyProcess; draft/week/all), `loadFfOpportunity` (ffverse expected fantasy points; weekly/pbp_pass/pbp_rush, latest/v1.0.0).

Also: shared loader internals replace per-loader HTTP/parse boilerplate, and a scheduled live-canary workflow now runs every loader against real assets twice a week so upstream drift can never hide behind mocked tests again.
