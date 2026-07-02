/**
 * Live smoke test: runs every loader against real nflverse (and companion)
 * assets. Unit tests mock HTTP, so only this catches upstream asset drift.
 *
 * Usage: npm run build && node scripts/live-smoke.mjs
 * Exits non-zero if any loader fails (consumed by the live-canary workflow).
 */

import {
  loadCombine,
  loadContracts,
  loadDepthCharts,
  loadDraftPicks,
  loadFfOpportunity,
  loadFfPlayerids,
  loadFfRankings,
  loadFtnCharting,
  loadInjuries,
  loadNextgenStats,
  loadOfficials,
  loadParticipation,
  loadPbp,
  loadPfrAdvstats,
  loadPlayers,
  loadPlayerStats,
  loadRosters,
  loadRostersWeekly,
  loadSchedules,
  loadSnapCounts,
  loadTeams,
  loadTeamStats,
  loadTrades,
} from '../dist/index.js';

// Most recently completed season; safe target for every dataset
const SEASON = (() => {
  const now = new Date();
  const inSeasonYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return inSeasonYear - 1;
})();

const checks = [
  [`loadPbp(${SEASON}, parquet)`, () => loadPbp(SEASON, { format: 'parquet' })],
  [`loadPlayerStats(${SEASON}, week)`, () => loadPlayerStats(SEASON)],
  [
    `loadPlayerStats(${SEASON}, reg+post)`,
    () => loadPlayerStats(SEASON, { summaryLevel: 'reg+post' }),
  ],
  [`loadTeamStats(${SEASON})`, () => loadTeamStats(SEASON)],
  [`loadSchedules(${SEASON})`, () => loadSchedules(SEASON)],
  ['loadTeams()', () => loadTeams()],
  ['loadPlayers()', () => loadPlayers()],
  [`loadRosters(${SEASON})`, () => loadRosters(SEASON)],
  [`loadRostersWeekly(${SEASON})`, () => loadRostersWeekly(SEASON)],
  [`loadDepthCharts(${SEASON})`, () => loadDepthCharts(SEASON)],
  [`loadParticipation(${Math.min(SEASON, 2023)})`, () => loadParticipation(Math.min(SEASON, 2023))],
  [`loadInjuries(${SEASON})`, () => loadInjuries(SEASON)],
  [`loadSnapCounts(${SEASON})`, () => loadSnapCounts(SEASON)],
  [`loadFtnCharting(${SEASON})`, () => loadFtnCharting(SEASON)],
  [`loadDraftPicks(${SEASON})`, () => loadDraftPicks(SEASON)],
  [`loadCombine(${SEASON})`, () => loadCombine(SEASON)],
  ['loadContracts()', () => loadContracts()],
  [`loadOfficials(${SEASON})`, () => loadOfficials(SEASON)],
  [`loadTrades(${SEASON})`, () => loadTrades(SEASON)],
  [`loadNextgenStats(${SEASON})`, () => loadNextgenStats(SEASON)],
  [
    `loadPfrAdvstats(${SEASON}, pass/week)`,
    () => loadPfrAdvstats(SEASON, { statType: 'pass', summaryLevel: 'week' }),
  ],
  [
    `loadPfrAdvstats(${SEASON}, def/season)`,
    () => loadPfrAdvstats(SEASON, { statType: 'def', summaryLevel: 'season' }),
  ],
  ['loadFfPlayerids()', () => loadFfPlayerids()],
  ["loadFfRankings('draft')", () => loadFfRankings('draft')],
  [`loadFfOpportunity(${SEASON})`, () => loadFfOpportunity(SEASON)],
];

let failures = 0;

for (const [name, fn] of checks) {
  const start = Date.now();
  try {
    const result = await fn();
    const secs = ((Date.now() - start) / 1000).toFixed(1);
    if (result.ok && result.value.length > 0) {
      console.log(`PASS ${name} -> ${result.value.length} rows (${secs}s)`);
    } else if (result.ok) {
      failures++;
      console.log(`FAIL ${name} -> 0 rows returned (${secs}s)`);
    } else {
      failures++;
      console.log(
        `FAIL ${name} -> ${result.error?.name}: ${String(result.error?.message).slice(0, 160)}`
      );
    }
  } catch (err) {
    failures++;
    console.log(`FAIL ${name} -> threw: ${String(err).slice(0, 160)}`);
  }
}

console.log(`\n${checks.length - failures}/${checks.length} live checks passed`);
if (failures > 0) process.exit(1);
