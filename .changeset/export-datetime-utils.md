---
'@nflverse/nflreadts': minor
---

Export the datetime utilities from the package entry point. `getCurrentSeason()`, `getSeasonFromDate()`, `getSeasonFlipDate()` (the Wednesday-after-Labor-Day flip), `getCurrentWeek()`, season/week range generators, and the date helpers are now part of the public API, plus a `mostRecentSeason` alias matching nflreadr's `most_recent_season()`. Previously these existed internally but were not exported, forcing consumers to reimplement the season flip rule.
