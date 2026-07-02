---
'@nflverse/nflreadts': minor
---

Repoint all loaders at current nflverse-data assets (live-verified against the 2025 nflverse reorganization):

- `loadPlayerStats` now reads the `stats_player` release; `summaryLevel` selects the pre-aggregated file (`week`/`reg`/`post`/`reg+post`) and client-side aggregation was removed. `PlayerStatsRecord` matches the live 115-column schema (renames: `passing_interceptions`, `sacks_suffered`, `sack_yards_lost`; new: `passing_cpoe`, `wopr`, return/penalty/gwfg fields, and more).
- `loadSchedules` fetches the single all-seasons `games` file and filters requested seasons (per-season `sched_{year}` assets never existed).
- `loadTeams` reads `teams_colors_logos`; `current: true` keeps the 32 active franchise abbreviations.
- `loadParticipation` reads the `pbp_participation` release and caps availability at the most recently completed season (FTN delivers after each postseason).
- `buildWeeklyRosterUrl` points at the `weekly_rosters` release tag.
- New `buildTeamStatsUrl` for the `stats_team` release.
