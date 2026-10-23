/**
 * InternConnect — Manual sync endpoint (Phase 5)
 *
 * Server-side only. Requires a sync secret (SYNC_SECRET env var).
 * If SYNC_SECRET is not configured, this endpoint is intentionally disabled
 * so it can never be abused. It is NOT a substitute for real authentication
 * and authorization; document that it must remain disabled until proper
 * admin auth is implemented.
 *
 * Never returns credentials or sensitive server details.
 */

import { NextResponse } from "next/server";
import { runSync } from "@/lib/sources/sync";
import { missingConfig } from "@/lib/sources/sync";

function getSyncSecret(): string | null {
  const s = process.env.SYNC_SECRET;
  if (!s || s.trim() === "" || s === "REPLACE_ME") return null;
  return s.trim();
}

export async function POST(request: Request) {
  const configuredSecret = getSyncSecret();

  // Intentionally disabled when no secret is configured.
  if (!configuredSecret) {
    return NextResponse.json(
      {
        error: "Sync endpoint disabled.",
        reason: "SYNC_SECRET is not configured.",
        required: ["SYNC_SECRET"],
      },
      { status: 503 }
    );
  }

  // Validate the provided secret without leaking it.
  const provided = request.headers.get("x-sync-secret") ?? "";
  if (provided !== configuredSecret) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  // Prevent arbitrary URL fetching — this endpoint only runs our configured sources.
  const run = await runSync();

  return NextResponse.json(
    {
      ok: run.ok,
      runId: run.id,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      totalNew: run.totalNew,
      totalChanged: run.totalChanged,
      totalErrors: run.totalErrors,
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
}

export async function GET() {
  // Status probe — does not run a sync. Safe to expose.
  const configuredSecret = getSyncSecret();
  const sources = (await import("@/lib/sources/sync")).loadSources();
  return NextResponse.json({
    syncEnabled: Boolean(configuredSecret),
    sources: sources.map((s) => ({ type: s.type, token: s.token })),
    missing: missingConfig(),
  });
}