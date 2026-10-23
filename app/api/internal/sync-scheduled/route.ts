/**
 * InternConnect — Scheduled sync endpoint (Phase 7)
 *
 * Called by an external scheduler (cron, GitHub Actions, Vercel Cron, etc.).
 * Requires CRON_SECRET in production. Local/external scheduler testing may use
 * SYNC_SECRET when NODE_ENV is not production. Never exposes credentials.
 *
 * Safe to retry; partial source failures don't discard other sources.
 * Does NOT close jobs after one failed request — only marks closed after
 * reliable successful source checks.
 *
 * If SYNC_SECRET is not configured, returns 503 with guidance.
 */

import { NextResponse } from "next/server";
import { runSync, closeUnseenJobs, loadSources } from "@/lib/sources/sync";

export const maxDuration = 120;

let scheduledSyncInProgress = false;



function getSyncSecret(): string | null {
  const s = process.env.SYNC_SECRET;
  if (!s || s.trim() === "" || s === "REPLACE_ME") return null;
  return s.trim();
}

function getCronSecret(): string | null {
  const s = process.env.CRON_SECRET;
  if (!s || s.trim() === "" || s === "REPLACE_ME") return null;
  return s.trim();
}

export async function POST(request: Request) {
  const syncSecret = getSyncSecret();
  const cronSecret = getCronSecret();
  const production = process.env.NODE_ENV === "production";
  const configuredSecret = production ? cronSecret : syncSecret ?? cronSecret;

  if (!configuredSecret) {
    return NextResponse.json(
      {
        error: "Scheduled sync not active.",
        reason: production
          ? "CRON_SECRET is not configured."
          : "SYNC_SECRET or CRON_SECRET is not configured.",
        required: production ? ["CRON_SECRET"] : ["SYNC_SECRET", "CRON_SECRET"],
      },
      { status: 503 }
    );
  }

  // Validate secret without leaking.
  const provided =
    request.headers.get("x-sync-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (production ? provided !== cronSecret : provided !== syncSecret && provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (scheduledSyncInProgress) {
    return NextResponse.json(
      { error: "Scheduled sync already in progress." },
      { status: 409 }
    );
  }

  scheduledSyncInProgress = true;

  try {
  // Run the full sync.
  const run = await runSync();

  // Only close jobs we haven't seen in SUCCESSFUL source checks.
  // We gather sourceIds from sources that returned ok=true and jobs.length > 0.
  const successfulSources = run.sources.filter((s) => s.ok);
  const seenSourceIds = successfulSources
    .filter((s) => s.ok && s.jobs.length > 0)
    .flatMap((s) => s.jobs.map((j) => j.sourceId));

  const closedResult = await closeUnseenJobs(
    seenSourceIds,
    run.finishedAt,
    successfulSources.map((s) => `${s.sourceType}:${s.token}`)
  );
  const lastSuccessfulRefreshAt = successfulSources
    .map((source) => source.health.lastSuccessfulRefreshAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return NextResponse.json(
    {
      ok: run.ok,
      runId: run.id,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      totalNew: run.totalNew,
      totalChanged: run.totalChanged,
      totalErrors: run.totalErrors,
      jobsClosed: closedResult.closed,
      jobsSkipped: closedResult.skipped,
      lastSuccessfulRefreshAt,
      sources: run.sources.map((s) => ({
        sourceType: s.sourceType,
        token: s.token,
        ok: s.ok,
        jobCount: s.jobs.length,
        errors: s.errors,
        summary: s.summary,
        fetchedAt: s.fetchedAt,
        health: s.health,
      })),
    },
    { status: run.ok ? 200 : 502 }
  );
  } finally {
    scheduledSyncInProgress = false;
  }
}

export async function GET() {
  // Status probe — safe to expose, does not run sync.
  const configuredSecret = process.env.NODE_ENV === "production"
    ? getCronSecret()
    : getSyncSecret() ?? getCronSecret();
  const sources = loadSources();
  const intervalHours = Number(process.env.NEXT_SYNC_HOURS) || 12;

  return NextResponse.json({
    scheduledSyncActive: Boolean(configuredSecret),
    productionRequiresCronSecret: process.env.NODE_ENV === "production",
    vercelCronConfigured: Boolean(getCronSecret()),
    intervalHours,
    sources: sources.map((s) => ({ type: s.type, token: s.token })),
    missing: sources.length === 0
      ? ["No source configured. Set GREENHOUSE_BOARD_TOKEN, LEVER_COMPANY_IDENTIFIER, or ASHBY_BOARD_NAME."]
      : [],
    note: "Vercel uses CRON_SECRET for the declared 12-hour cron. Other schedulers may use SYNC_SECRET with x-sync-secret.",
  });
}