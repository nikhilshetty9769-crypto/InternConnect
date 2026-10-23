import { describe, expect, it } from "vitest";
import { DEMO_JOBS } from "@/lib/demo-data";
import { getListingSourceCounts, normalizedSourceToJob } from "@/lib/data/jobs";
import type { NormalizedJob } from "@/lib/sources/types";

describe("real and demo job separation", () => {
  it("counts mixed listings by source without calling the set demo data", () => {
    const live = normalizedSourceToJob({
      sourceId: "gh:example:44",
      sourceType: "greenhouse",
      boardToken: "example",
      title: "Data Intern",
      companyName: "Example Labs",
      location: "Remote",
      description: "Analyze data.",
      applicationUrl: "https://boards.greenhouse.io/example/jobs/44",
      publishedAt: "2026-10-01T00:00:00.000Z",
      firstSeenAt: "2026-10-02T00:00:00.000Z",
      lastVerifiedAt: "2026-10-03T00:00:00.000Z",
      lastChangedAt: "2026-10-03T00:00:00.000Z",
      status: "published",
      missingFields: [],
      raw: {},
    });

    expect(getListingSourceCounts([DEMO_JOBS[0], live])).toEqual({
      total: 2,
      demo: 1,
      live: 1,
    });
  });

  it("keeps live source identity and URLs without adding a demo label", () => {
    const source: NormalizedJob = {
      sourceId: "gh:example:42",
      sourceType: "greenhouse",
      boardToken: "example",
      title: "Engineering Intern",
      companyName: "Example Labs",
      location: "Remote",
      description: "Build useful things.",
      applicationUrl: "https://boards.greenhouse.io/example/jobs/42",
      publishedAt: "2026-10-01T00:00:00.000Z",
      firstSeenAt: "2026-10-02T00:00:00.000Z",
      lastVerifiedAt: "2026-10-03T00:00:00.000Z",
      lastChangedAt: "2026-10-03T00:00:00.000Z",
      status: "published",
      missingFields: [],
      raw: {},
    };

    const job = normalizedSourceToJob(source);

    expect(job.id).toBe(source.sourceId);
    expect(job.sourceId).toBe(source.sourceId);
    expect(job.sourceType).toBe("greenhouse");
    expect(job.sourceUrl).toBe(source.applicationUrl);
    expect(job.applicationLink).toBe(source.applicationUrl);
    expect(job.company.name).toBe(source.companyName);
    expect(job.location).toBe(source.location);
    expect(job.isDemo).toBe(false);
    expect(DEMO_JOBS.every((demo) => demo.isDemo)).toBe(true);
  });

  it("preserves missing live fields instead of fabricating values", () => {
    const job = normalizedSourceToJob({
      sourceId: "gh:example:43",
      sourceType: "greenhouse",
      boardToken: "example",
      title: "Intern",
      companyName: null,
      location: null,
      description: null,
      applicationUrl: null,
      publishedAt: null,
      firstSeenAt: "2026-10-02T00:00:00.000Z",
      lastVerifiedAt: "2026-10-03T00:00:00.000Z",
      lastChangedAt: "2026-10-03T00:00:00.000Z",
      status: "published",
      missingFields: ["company.name", "location", "applicationUrl"],
      raw: {},
    });

    expect(job.company.name).toBe("");
    expect(job.location).toBe("");
    expect(job.applicationLink).toBe("");
    expect(job.isDemo).toBe(false);
  });
});
