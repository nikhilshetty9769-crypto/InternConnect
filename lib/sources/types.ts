/**
 * Shared source connector types.
 *
 * A "source" is any career-board feed we pull from (Greenhouse, Lever, ...).
 * A "normalized" posting is the canonical shape we store, regardless of origin.
 */

export type SourceType = "greenhouse" | "lever" | "ashby" | "manual";

export interface NormalizedJob {
  /** Stable, deterministic identifier: sourceType:boardToken:sourceJobId */
  sourceId: string;
  sourceType: SourceType;
  boardToken: string; // e.g. greenhouse board slug, lever company site name
  title: string;
  companyName: string | null;
  location: string | null;
  description: string | null;
  /** Public source posting URL, when distinct from the application URL. */
  sourceUrl?: string | null;
  applicationUrl: string | null;
  /** Publication date as reported by the source (when provided). */
  publishedAt: string | null;
  /** When we first discovered this posting. */
  firstSeenAt: string;
  /** When we last confirmed the posting still exists. */
  lastVerifiedAt: string;
  /** When the record last changed (title, url, status). */
  lastChangedAt: string;
  /** Source-reported status. */
  status: "published" | "unpublished" | "closed" | "error";
  /** Fields the source did not provide, so we never fabricate them. */
  missingFields: string[];
  raw: Record<string, unknown>;
}

export interface SourceConfig {
  type: SourceType;
  token: string; // board identifier
  enabled: boolean;
}

export interface SourceResult {
  sourceType: SourceType;
  token: string;
  ok: boolean;
  jobs: NormalizedJob[];
  errors: string[];
  summary: string;
  fetchedAt: string;
  health: SourceHealth;
}

export type SourceHealthStatus =
  | "not_configured"
  | "fetch_failed"
  | "invalid_response"
  | "empty_board"
  | "no_internships"
  | "no_india_eligible_internships"
  | "eligible_internships";

export interface SourceHealth {
  status: SourceHealthStatus;
  totalPostings: number;
  internshipMatches: number;
  indiaEligible: number;
  lastSuccessfulRefreshAt?: string | null;
  stale?: boolean;
}

export interface SyncRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  sources: SourceResult[];
  totalNew: number;
  totalChanged: number;
  totalErrors: number;
  ok: boolean;
}