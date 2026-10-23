/**
 * InternConnect — Synchronization service (Phase 5)
 *
 * Orchestrates fetching from all configured sources, normalizing, deduplicating,
 * and recording per-source results. Handles partial failures without discarding
 * successful results from other sources.
 *
 * A job is closed ONLY after reliable successful source checks establish it is
 * no longer published. One failed request does NOT close jobs.
 *
 * When GREENHOUSE_BOARD_TOKEN / LEVER_COMPANY_IDENTIFIER / ASHBY_BOARD_NAME are missing, the
 * service reports exactly which variables are required — it never invents them.
 */

import type {
  NormalizedJob,
  SourceHealth,
  SourceResult,
  SyncRun,
} from "@/lib/sources/types";
import { sourceJobRepository } from "@/lib/sources/repository";
import { fetchGreenhouseJobs, fetchGreenhouseInternships, isInternshipPosting } from "@/lib/sources/greenhouse";
import { fetchLeverPostings } from "@/lib/sources/lever";
import { fetchAshbyJobs, fetchAshbyInternships } from "@/lib/sources/ashby";
import { cacheLife } from "next/cache";

function newRunId(): string {
  return `sync-${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function healthFor(
  errors: string[],
  totalPostings: number,
  internshipMatches: number,
  indiaEligible: number,
  lastSuccessfulRefreshAt: string | null = null
): SourceHealth {
  const stale = lastSuccessfulRefreshAt
    ? Date.now() - new Date(lastSuccessfulRefreshAt).getTime() >
      (Number(process.env.NEXT_SYNC_HOURS) || 12) * 3_600_000 * 2
    : true;
  const base = { totalPostings, internshipMatches, indiaEligible, lastSuccessfulRefreshAt, stale };
  if (errors.length > 0) {
    const errorText = errors.join(" ").toLowerCase();
    return {
      status: errorText.includes("invalid response")
        ? "invalid_response"
        : "fetch_failed",
      ...base,
    };
  }
  if (totalPostings === 0) {
    return { status: "empty_board", ...base };
  }
  if (internshipMatches === 0) {
    return { status: "no_internships", ...base };
  }
  if (indiaEligible === 0) {
    return {
      status: "no_india_eligible_internships",
      ...base,
    };
  }
  return { status: "eligible_internships", ...base };
}

/**
 * List configured sources from environment variables.
 * Returns empty array when none are configured.
 */
export function loadSources(): { type: string; token: string; enabled: boolean }[] {
  const sources: { type: string; token: string; enabled: boolean }[] = [];

  const ghTokens = (process.env.GREENHOUSE_BOARD_TOKEN ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token !== "" && token !== "REPLACE_ME");
  for (const token of ghTokens) {
    sources.push({ type: "greenhouse", token, enabled: true });
  }

  const levId = process.env.LEVER_COMPANY_IDENTIFIER;
  if (levId && levId.trim() !== "" && levId !== "REPLACE_ME") {
    sources.push({ type: "lever", token: levId.trim(), enabled: true });
  }

  const ashbyBoardName = process.env.ASHBY_BOARD_NAME;
  if (ashbyBoardName && ashbyBoardName.trim() !== "" && ashbyBoardName !== "REPLACE_ME") {
    sources.push({ type: "ashby", token: ashbyBoardName.trim(), enabled: true });
  }

  return sources;
}

/** Required env variables that are missing. */
export function missingConfig(): string[] {
  const missing: string[] = [];
  const sources = loadSources();
  if (!sources.length) {
    missing.push(
      "No source configured. Set GREENHOUSE_BOARD_TOKEN, LEVER_COMPANY_IDENTIFIER, or ASHBY_BOARD_NAME."
    );
  }
  return missing;
}

const INDIA_LOCATION_SIGNALS = [
  "india",
  "bengaluru",
  "bangalore",
  "mumbai",
  "pune",
  "hyderabad",
  "new delhi",
  "delhi",
  "gurugram",
  "gurgaon",
  "noida",
  "chennai",
  "kolkata",
];

/**
 * Keep India-located internships and remote postings that explicitly name
 * India. A generic "Remote" label is not evidence of India eligibility.
 */
export function isIndiaEligibleLocation(location: string | null): boolean {
  const normalized = location?.toLowerCase().trim() ?? "";
  return INDIA_LOCATION_SIGNALS.some((signal) => normalized.includes(signal));
}

export function deduplicateNormalizedJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const urlKey = job.applicationUrl ?? job.sourceUrl;
    const fallbackKey = [
      job.title,
      job.companyName ?? "",
      job.location ?? "",
    ]
      .map((value) => value.trim().toLowerCase())
      .join("|");
    const key = urlKey?.trim().toLowerCase() || fallbackKey;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Convert source-specific normalized job into shared NormalizedJob shape.
 */
function normalizeForStorage(
  job: {
    sourceType: string;
    sourceId: string;
    title: string;
    companyName: string | null;
    location: string | null;
    description: string | null;
    sourceUrl?: string | null;
    applicationUrl: string | null;
    boardToken?: string;
    companyId?: string;
    publicationDate: string | null;
    status: string;
    missingFields: string[];
    raw: Record<string, unknown>;
  },
  firstSeenAt?: string
): NormalizedJob {
  const now = nowIso();
  return {
    sourceType: job.sourceType as import("@/lib/sources/types").SourceType,
    sourceId: job.sourceId,
    boardToken: job.boardToken ?? job.companyId ?? "",
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    description: job.description,
    sourceUrl: job.sourceUrl,
    applicationUrl: job.applicationUrl,
    publishedAt: job.publicationDate,
    firstSeenAt: firstSeenAt ?? now,
    lastVerifiedAt: now,
    lastChangedAt: now,
    status: job.status as "published" | "unpublished" | "closed" | "error",
    missingFields: job.missingFields,
    raw: job.raw,
  };
}

/**
 * Run a full sync across all configured sources.
 * Returns a SyncRun with per-source results.
 */
export async function runSync(): Promise<SyncRun> {
  const run: SyncRun = {
    id: newRunId(),
    startedAt: nowIso(),
    finishedAt: "",
    sources: [],
    totalNew: 0,
    totalChanged: 0,
    totalErrors: 0,
    ok: true,
  };

  const sources = loadSources();

  if (sources.length === 0) {
    run.ok = false;
    run.totalErrors += 1;
    run.sources.push({
      sourceType: "manual" as import("@/lib/sources/types").SourceType,
      token: "",
      ok: false,
      jobs: [],
      errors: missingConfig(),
      summary: "No source configured.",
      fetchedAt: nowIso(),
      health: {
        status: "not_configured",
        totalPostings: 0,
        internshipMatches: 0,
        indiaEligible: 0,
        lastSuccessfulRefreshAt: null,
        stale: true,
      },
    });
    run.finishedAt = nowIso();
    return run;
  }

  for (const src of sources) {
    let previousSuccessfulRefreshAt: string | null = null;
    try {
      previousSuccessfulRefreshAt = await sourceJobRepository.lastSync(src.type, src.token);
    } catch {
      // Health reporting must not prevent the source fetch.
    }
    const sourceResult: SourceResult = {
      sourceType: src.type as import("@/lib/sources/types").SourceType,
      token: src.token,
      ok: false,
      jobs: [],
      errors: [],
      summary: "",
      fetchedAt: nowIso(),
      health: {
        status: "fetch_failed",
        totalPostings: 0,
        internshipMatches: 0,
        indiaEligible: 0,
        lastSuccessfulRefreshAt: previousSuccessfulRefreshAt,
        stale: true,
      },
    };

    try {
      if (src.type === "greenhouse") {
        const r = await fetchGreenhouseJobs(src.token, { timeout: 10000, retries: 1 });
        sourceResult.ok = r.errors.length === 0;
        sourceResult.jobs = r.jobs.map((j) =>
          normalizeForStorage(j, sourceResult.fetchedAt)
        );
        sourceResult.errors = r.errors;
        sourceResult.summary = r.summary;
      } else if (src.type === "ashby") {
        const r = await fetchAshbyJobs(src.token, { timeout: 10000, retries: 1 });
        sourceResult.ok = r.errors.length === 0;
        sourceResult.jobs = r.jobs.map((j) =>
          normalizeForStorage(j, sourceResult.fetchedAt)
        );
        sourceResult.errors = r.errors;
        sourceResult.summary = r.summary;
      } else if (src.type === "lever") {
        const r = await fetchLeverPostings(src.token, { timeout: 10000, retries: 1 });
        sourceResult.ok = r.errors.length === 0;
        sourceResult.jobs = r.jobs.map((j) =>
          normalizeForStorage(j, sourceResult.fetchedAt)
        );
        sourceResult.errors = r.errors;
        sourceResult.summary = r.summary;
      }

      const internshipMatches = sourceResult.jobs.filter((job) =>
        isInternshipPosting({
          title: job.title,
          employment_type: job.raw.employmentType as string | undefined,
        })
      ).length;
      sourceResult.health = healthFor(
        sourceResult.errors,
        sourceResult.jobs.length,
        internshipMatches,
        sourceResult.jobs.filter((job) => isIndiaEligibleLocation(job.location)).length,
        sourceResult.ok ? sourceResult.fetchedAt : previousSuccessfulRefreshAt
      );
    } catch (e: unknown) {
      const msg = `${src.type} source crashed: ${
        e instanceof Error ? e.message : String(e)
      }`;
      sourceResult.errors = [msg];
      sourceResult.ok = false;
      sourceResult.summary = msg;
      sourceResult.health = healthFor(
        sourceResult.errors,
        0,
        0,
        0,
        previousSuccessfulRefreshAt
      );
    }

    // Upsert valid records independently per source (partial failure tolerated).
    let inserted = 0;
    let changed = 0;
    if (sourceResult.jobs.length > 0) {
      try {
        const upsertResult = await sourceJobRepository.upsertMany(
          sourceResult.jobs
        );
        inserted = upsertResult.inserted;
        changed = upsertResult.changed;
        run.totalNew += inserted;
        run.totalChanged += changed;
      } catch (e: unknown) {
        const msg = `${src.type} upsert error: ${
          e instanceof Error ? e.message : String(e)
        }`;
        sourceResult.errors.push(msg);
        sourceResult.ok = false;
      }
    }

    // Only successful source checks establish a trustworthy refresh timestamp.
    if (sourceResult.ok) {
      try {
        await sourceJobRepository.setLastSync(src.type, src.token, sourceResult.fetchedAt);
      } catch {
        // Non-fatal; don't fail the whole sync for a timestamp write.
      }
    }

    run.totalErrors += sourceResult.errors.length;
    if (!sourceResult.ok) run.ok = false;
    run.sources.push(sourceResult);
  }

  run.finishedAt = nowIso();
  return run;
}

/**
 * Read live internship postings from every configured source.
 *
 * The stored repository is an in-memory map that is empty on a fresh server
 * until a sync runs (which requires SYNC_SECRET). The Latest Opportunities
 * page therefore reads directly from the configured boards so it can show real
 * data without a manual sync step.
 *
 * Only internship postings are returned — non-internship roles are filtered
 * out by the connectors, never relabelled. Errors are reported per source and
 * never replaced with fabricated listings.
 */
export async function fetchConfiguredInternships(): Promise<{
  jobs: NormalizedJob[];
  errors: string[];
  sourcesChecked: number;
  sourceHealth: Array<SourceHealth & { sourceType: string; token: string }>;
  lastSuccessfulRefreshAt: string | null;
}> {
  // Cached so the board is polled at most once per cache window instead of on
  // every request. `cacheLife` gives the entry an explicit lifetime; without
  // it the implicit `default` profile (15 min revalidate) applies.
  'use cache';
  cacheLife('hours');

  const errors: string[] = [];
  const jobs: NormalizedJob[] = [];
  const sources = loadSources();
  const sourceHealth: Array<SourceHealth & { sourceType: string; token: string }> = [];
  let lastSuccessfulRefreshAt: string | null = null;

  for (const src of sources) {
    try {
      if (src.type === "greenhouse") {
        const r = await fetchGreenhouseInternships(src.token, {
          timeout: 10000,
          retries: 1,
        });
        errors.push(...r.errors);
        const indiaInternships = r.internships.filter((job) =>
          isIndiaEligibleLocation(job.location)
        ).length;
        sourceHealth.push({
          ...healthFor(r.errors, r.jobs.length, r.internships.length, indiaInternships,
            r.errors.length === 0 ? nowIso() : null),
          sourceType: src.type,
          token: src.token,
        });
        for (const j of r.internships) {
          jobs.push(normalizeForStorage(j));
        }
      } else if (src.type === "lever") {
        const r = await fetchLeverPostings(src.token, { timeout: 10000, retries: 1 });
        errors.push(...r.errors);
        const internshipJobs = r.jobs.filter((job) =>
          isInternshipPosting({ title: job.title })
        );
        sourceHealth.push({
          ...healthFor(
            r.errors,
            r.jobs.length,
            internshipJobs.length,
            internshipJobs.filter((job) => isIndiaEligibleLocation(job.location)).length
            , r.errors.length === 0 ? nowIso() : null
          ),
          sourceType: src.type,
          token: src.token,
        });
        for (const j of r.jobs) {
          // Lever postings are not filtered by title — a board may publish
          // internships under ambiguous titles. Keep only postings that the
          // internship filter recognises.
          if (!isInternshipPosting({ title: j.title })) continue;
          jobs.push(normalizeForStorage(j));
        }
      } else if (src.type === "ashby") {
        const r = await fetchAshbyInternships(src.token, {
          timeout: 10000,
          retries: 1,
        });
        errors.push(...r.errors);
        const indiaInternships = r.internships.filter((job) =>
          isIndiaEligibleLocation(job.location)
        ).length;
        sourceHealth.push({
          ...healthFor(r.errors, r.jobs.length, r.internships.length, indiaInternships,
            r.errors.length === 0 ? nowIso() : null),
          sourceType: src.type,
          token: src.token,
        });
        for (const j of r.internships) {
          jobs.push(normalizeForStorage(j));
        }
        const currentHealth = sourceHealth[sourceHealth.length - 1];
        if (currentHealth?.lastSuccessfulRefreshAt) {
          lastSuccessfulRefreshAt = currentHealth.lastSuccessfulRefreshAt;
        }
      }
    } catch (e: unknown) {
      const message = `${src.type} source failed: ${e instanceof Error ? e.message : String(e)}`;
      errors.push(message);
      sourceHealth.push({
        ...healthFor([message], 0, 0, 0),
        sourceType: src.type,
        token: src.token,
      });
    }
  }

  return {
    jobs: deduplicateNormalizedJobs(
      jobs.filter((job) => isIndiaEligibleLocation(job.location))
    ),
    errors,
    sourcesChecked: sources.length,
    sourceHealth,
    lastSuccessfulRefreshAt,
  };
}

/**
 * Mark previously-published jobs as closed only if they were not seen during
 * a successful sync. This must be called AFTER reliable source checks.
 */
export async function closeUnseenJobs(
  seenSourceIds: string[],
  verifiedAt: string,
  sourceKeys?: string[]
): Promise<{ closed: number; skipped: number }> {
  const all = await sourceJobRepository.list({ status: "published" });
  const eligible = sourceKeys
    ? all.filter((j) => sourceKeys.includes(`${j.sourceType}:${j.boardToken}`))
    : all;
  const toClose = eligible.filter((j) => !seenSourceIds.includes(j.sourceId));

  const closed = await sourceJobRepository.markClosed(toClose.map((j) => j.sourceId), verifiedAt);
  const skipped = eligible.length - closed;
  return { closed, skipped };
}
