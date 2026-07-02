/**
 * Fantasy football rankings type definitions
 * @module types/ff-rankings
 */

import type { TeamAbbr } from './common.js';

/**
 * Ranking dataset to load
 * - 'draft': latest draft rankings/projections (FantasyPros ECR)
 * - 'week': latest weekly rankings
 * - 'all': full ECR ranking history
 */
export type FfRankingsType = 'draft' | 'week' | 'all';

/**
 * Fantasy football rankings record (DynastyProcess FantasyPros ECR archive)
 *
 * Columns vary by ranking type: 'draft' and 'all' come from the ECR database
 * (keyed by `fp_page`/`page_type`), while 'week' comes from the weekly
 * scrape and uses `page`/`fantasypros_id`/`player_name` instead. The shared
 * consensus-ranking columns (`ecr`, `sd`, `best`, `worst`, `scrape_date`) are
 * present in every type.
 *
 * Data Attribution: FantasyPros via DynastyProcess.com
 *
 * @see https://nflreadr.nflverse.com/reference/load_ff_rankings.html
 */
export interface FfRankingsRecord {
  // ===== SHARED CONSENSUS COLUMNS (all types) =====
  /** Expert consensus rank */
  ecr: number | null;
  /** Standard deviation of expert ranks */
  sd: number | null;
  /** Best (lowest) expert rank */
  best: number | null;
  /** Worst (highest) expert rank */
  worst: number | null;
  /** Position abbreviation */
  pos: string | null;
  /** Team abbreviation */
  team: TeamAbbr | null;
  /** Date the ranking was scraped (YYYY-MM-DD) */
  scrape_date: string | null;

  // ===== DRAFT / ALL COLUMNS (types 'draft' and 'all') =====
  /** FantasyPros page path the ranking came from */
  fp_page?: string | null;
  /** Ranking page type (e.g. "draft-overall", "weekly-op") */
  page_type?: string | null;
  /** ECR type code (e.g. "bp" best-ball, "rp" redraft) */
  ecr_type?: string | null;
  /** Player (or DST) name */
  player?: string | null;
  /** FantasyPros player ID */
  id?: string | number | null;
  /** Lowercase name used for fuzzy joins */
  mergename?: string | null;
  /** Team abbreviation (duplicate column in the ECR database) */
  tm?: TeamAbbr | null;
  /** SportsData player ID */
  sportsdata_id?: string | number | null;
  /** Yahoo player ID */
  yahoo_id?: string | number | null;
  /** CBS player ID */
  cbs_id?: string | number | null;
  /** Average ownership percentage */
  player_owned_avg?: number | null;
  /** ESPN ownership percentage */
  player_owned_espn?: number | null;
  /** Yahoo ownership percentage */
  player_owned_yahoo?: number | null;
  /** Player image URL */
  player_image_url?: string | null;
  /** Player square image URL */
  player_square_image_url?: string | null;
  /** Rank change since previous scrape */
  rank_delta?: number | null;
  /** Bye week (type 'draft' only) */
  bye?: number | null;
  /** Player page filename on FantasyPros */
  player_filename?: string | null;

  // ===== WEEK COLUMNS (type 'week') =====
  /** FantasyPros weekly page (e.g. "qb", "ppr-rb") */
  page?: string | null;
  /** Position of the weekly page */
  page_pos?: string | null;
  /** FantasyPros player ID */
  fantasypros_id?: string | number | null;
  /** Player name */
  player_name?: string | null;
  /** Ordinal rank on the page */
  rank?: number | null;
  /** Eligible positions */
  player_positions?: string | null;
  /** Short display name */
  player_short_name?: string | null;
  /** Position eligibility string */
  player_eligibility?: string | null;
  /** Player page URL */
  player_page_url?: string | null;
  /** Bye week */
  player_bye_week?: string | number | null;
  /** Weekly opponent (e.g. "vs. ARI") */
  player_opponent?: string | null;
  /** Weekly opponent team abbreviation */
  player_opponent_id?: TeamAbbr | null;
  /** ECR change since previous scrape */
  player_ecr_delta?: number | null;
  /** Analyst note */
  note?: string | null;
  /** Tag */
  tag?: string | null;
  /** Start/sit recommendation */
  recommendation?: string | null;
  /** Position rank label (e.g. "QB1") */
  pos_rank?: string | null;
  /** Start/sit letter grade */
  start_sit_grade?: string | null;
  /** Rest-of-week projected points */
  r2p_pts?: string | number | null;

  /** Allow additional columns the scrapes may add over time */
  [key: string]: string | number | boolean | null | undefined;
}
