/**
 * InternConnect — Saved jobs & tracking reliability tests (Phase 9.1)
 *
 * Tests the canonical data-access layer, duplicate prevention, missing-ID
 * fallback, and persistence behavior (localStorage-backed providers).
 */

import { describe, expect, it } from "vitest";
import { decodeJobRouteId, resolveJobs, resolveExistingJobs } from "@/lib/data/jobs";

describe("resolveJobs (canonical lookup)", () => {
  it("decodes source IDs containing colons when received from a dynamic route", () => {
    expect(decodeJobRouteId("gh%3Ahackerrank%3A8229735")).toBe("gh:hackerrank:8229735");
    expect(decodeJobRouteId("gh:hackerrank:8229735")).toBe("gh:hackerrank:8229735");
  });

  it("resolves demo job IDs", async () => {
    const result = await resolveJobs(["job-1", "job-2"]);
    expect(result.length).toBe(2);
    expect(result[0].job).not.toBeNull();
    expect(result[0].job!.title).toBe("Software Engineering Intern — Summer 2026");
    expect(result[0].job!.isDemo).toBe(true);
  });

  it("deduplicates IDs", async () => {
    const result = await resolveJobs(["job-1", "job-1", "job-3"]);
    expect(result.length).toBe(2);
  });

  it("returns null for unknown IDs (missing job fallback)", async () => {
    const result = await resolveJobs(["unknown-id-999"]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("unknown-id-999");
    expect(result[0].job).toBeNull();
  });

  it("preserves order", async () => {
    const result = await resolveJobs(["job-3", "job-1", "unknown"]);
    expect(result.map((r) => r.id)).toEqual(["job-3", "job-1", "unknown"]);
  });
});

describe("resolveExistingJobs", () => {
  it("filters out missing jobs", async () => {
    const existing = await resolveExistingJobs(["job-1", "bad-id"]);
    expect(existing.length).toBe(1);
    expect(existing[0].id).toBe("job-1");
  });
});
