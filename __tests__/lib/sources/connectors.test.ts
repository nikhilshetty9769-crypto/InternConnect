/**
 * InternConnect — Source connector tests (Phase 10)
 *
 * Covers normalization, missing optional fields, invalid responses,
 * duplicate prevention, and missing configuration.
 */

import { describe, expect, it } from "vitest";
import {
  fetchGreenhouseJobs,
  fetchGreenhouseInternships,
  getGreenhouseBoardToken,
  stripHtml,
} from "@/lib/sources/greenhouse";
import {
  fetchLeverPostings,
  getLeverCompanyId,
} from "@/lib/sources/lever";
import {
  fetchAshbyJobs,
  fetchAshbyInternships,
  getAshbyBoardName,
} from "@/lib/sources/ashby";
import {
  deduplicateNormalizedJobs,
  isIndiaEligibleLocation,
  loadSources,
  missingConfig,
  runSync,
  closeUnseenJobs,
} from "@/lib/sources/sync";
import { CURATED_SOURCE_REGISTRY, findCuratedSource } from "@/lib/sources/registry";
import { sourceJobRepository } from "@/lib/sources/repository";

function mockFetch(impl: (input?: RequestInfo | URL) => Promise<Response>): void {
  globalThis.fetch = impl as unknown as typeof fetch;
}

describe("Greenhouse connector configuration", () => {
  it("keeps the curated registry evidence separate from enabled configuration", () => {
    const stripe = findCuratedSource("greenhouse", "stripe");

    expect(CURATED_SOURCE_REGISTRY).toHaveLength(31);
    expect(stripe?.status).toBe("verified");
    expect(stripe?.endpoint).toBe(
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true"
    );
    expect(stripe?.indiaEligibleAtResearch).toBe(3);
    expect(findCuratedSource("greenhouse", "uber")?.status).toBe("not-confirmed");
    expect(findCuratedSource("greenhouse", "groww")?.indiaEligibleAtResearch).toBe(1);
    expect(findCuratedSource("greenhouse", "rubrik")?.indiaEligibleAtResearch).toBe(2);
  });

  it("loads multiple configured Greenhouse boards without changing Ashby configuration", () => {
    const previousGreenhouse = process.env.GREENHOUSE_BOARD_TOKEN;
    const previousAshby = process.env.ASHBY_BOARD_NAME;
    process.env.GREENHOUSE_BOARD_TOKEN = "enterpret,hackerrank,stripe";
    process.env.ASHBY_BOARD_NAME = "ashby";

    expect(loadSources()).toEqual([
      { type: "greenhouse", token: "enterpret", enabled: true },
      { type: "greenhouse", token: "hackerrank", enabled: true },
      { type: "greenhouse", token: "stripe", enabled: true },
      { type: "ashby", token: "ashby", enabled: true },
    ]);

    if (previousGreenhouse === undefined) delete process.env.GREENHOUSE_BOARD_TOKEN;
    else process.env.GREENHOUSE_BOARD_TOKEN = previousGreenhouse;
    if (previousAshby === undefined) delete process.env.ASHBY_BOARD_NAME;
    else process.env.ASHBY_BOARD_NAME = previousAshby;
  });

  it("returns null when GREENHOUSE_BOARD_TOKEN is missing", () => {
    const prev = process.env.GREENHOUSE_BOARD_TOKEN;
    delete process.env.GREENHOUSE_BOARD_TOKEN;
    expect(getGreenhouseBoardToken()).toBeNull();
    process.env.GREENHOUSE_BOARD_TOKEN = prev;
  });

  it("rejects placeholder tokens", () => {
    const prev = process.env.GREENHOUSE_BOARD_TOKEN;
    process.env.GREENHOUSE_BOARD_TOKEN = "REPLACE_ME";
    expect(getGreenhouseBoardToken()).toBeNull();
    process.env.GREENHOUSE_BOARD_TOKEN = prev;
  });

  it("rejects empty tokens", () => {
    const prev = process.env.GREENHOUSE_BOARD_TOKEN;
    process.env.GREENHOUSE_BOARD_TOKEN = "";
    expect(getGreenhouseBoardToken()).toBeNull();
    process.env.GREENHOUSE_BOARD_TOKEN = prev;
  });

  it("does not classify internal roles as internships", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            jobs: [
              {
                id: 10,
                title: "Assistant Manager - Internal Audit",
                company_name: "Groww",
                location: { name: "Bengaluru-VTP, India" },
                absolute_url: "https://example.test/jobs/10",
              },
              {
                id: 11,
                title: "Video Editor Intern",
                company_name: "Groww",
                location: { name: "Bengaluru-VTP, India" },
                absolute_url: "https://example.test/jobs/11",
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const result = await fetchGreenhouseInternships("groww", { retries: 0 });

    expect(result.internships.map((job) => job.title)).toEqual(["Video Editor Intern"]);
  });
});

describe("Greenhouse fetch error handling", () => {
  it("fetches multiple boards independently while preserving each board identity", async () => {
    const requestedUrls: string[] = [];
    mockFetch((input) => {
      const url = String(input);
      requestedUrls.push(url);
      const board = url.includes("/enterpret/") ? "enterpret" : "hackerrank";
      return Promise.resolve(
        new Response(
          JSON.stringify({
            jobs: [{
              id: board === "enterpret" ? 1 : 2,
              title: "Software Engineering Intern",
              company_name: board === "enterpret" ? "Enterpret" : "HackerRank",
              location: { name: "Bengaluru, India" },
              absolute_url: `https://job-boards.greenhouse.io/${board}/jobs/1`,
            }],
          }),
          { status: 200 }
        )
      );
    });

    describe("source health reporting", () => {
      it("distinguishes an empty board from a board with no India-eligible internships", async () => {
        const previousGreenhouse = process.env.GREENHOUSE_BOARD_TOKEN;
        const previousLever = process.env.LEVER_COMPANY_IDENTIFIER;
        const previousAshby = process.env.ASHBY_BOARD_NAME;
        process.env.GREENHOUSE_BOARD_TOKEN = "empty-board";
        delete process.env.LEVER_COMPANY_IDENTIFIER;
        delete process.env.ASHBY_BOARD_NAME;

        mockFetch((input) => {
          const url = String(input);
          const jobs = url.includes("empty-board")
            ? []
            : [{
                id: 1,
                title: "Software Engineering Intern",
                company_name: "Example",
                location: { name: "New York" },
                absolute_url: "https://example.test/jobs/1",
              }];
          return Promise.resolve(new Response(JSON.stringify({ jobs }), { status: 200 }));
        });

        describe("scheduled sync lifecycle", () => {
          it("is idempotent, closes removed jobs only after a successful check, and preserves publication dates", async () => {
            const previousGreenhouse = process.env.GREENHOUSE_BOARD_TOKEN;
            const previousLever = process.env.LEVER_COMPANY_IDENTIFIER;
            const previousAshby = process.env.ASHBY_BOARD_NAME;
            process.env.GREENHOUSE_BOARD_TOKEN = "phase7-lifecycle";
            delete process.env.LEVER_COMPANY_IDENTIFIER;
            delete process.env.ASHBY_BOARD_NAME;

            let includeSecondJob = true;
            mockFetch(() =>
              Promise.resolve(
                new Response(
                  JSON.stringify({
                    jobs: [
                      {
                        id: 1,
                        title: "Software Engineering Intern",
                        company_name: "Lifecycle Test",
                        location: { name: "Bengaluru, India" },
                        absolute_url: "https://example.test/jobs/1",
                        first_published: "2026-10-20T00:00:00Z",
                      },
                      ...(includeSecondJob
                        ? [{
                            id: 2,
                            title: "Data Intern",
                            company_name: "Lifecycle Test",
                            location: { name: "Pune, India" },
                            absolute_url: "https://example.test/jobs/2",
                            first_published: "2026-10-21T00:00:00Z",
                          }]
                        : []),
                    ],
                  }),
                  { status: 200 }
                )
              )
            );

            const first = await runSync();
            expect(first.totalNew).toBe(2);
            expect(first.sources[0].health.lastSuccessfulRefreshAt).toBeTruthy();
            expect((await sourceJobRepository.findById("gh:phase7-lifecycle:1"))?.publishedAt)
              .toBe("2026-10-20T00:00:00Z");

            const second = await runSync();
            expect(second.totalNew).toBe(0);
            expect(second.totalChanged).toBe(0);

            includeSecondJob = false;
            const third = await runSync();
            const closed = await closeUnseenJobs(
              third.sources[0].jobs.map((job) => job.sourceId),
              third.finishedAt,
              ["greenhouse:phase7-lifecycle"]
            );
            expect(closed.closed).toBe(1);
            expect((await sourceJobRepository.findById("gh:phase7-lifecycle:2"))?.status)
              .toBe("closed");

            if (previousGreenhouse === undefined) delete process.env.GREENHOUSE_BOARD_TOKEN;
            else process.env.GREENHOUSE_BOARD_TOKEN = previousGreenhouse;
            if (previousLever === undefined) delete process.env.LEVER_COMPANY_IDENTIFIER;
            else process.env.LEVER_COMPANY_IDENTIFIER = previousLever;
            if (previousAshby === undefined) delete process.env.ASHBY_BOARD_NAME;
            else process.env.ASHBY_BOARD_NAME = previousAshby;
          });

          it("does not close existing jobs after a failed source check", async () => {
            const previousGreenhouse = process.env.GREENHOUSE_BOARD_TOKEN;
            const previousLever = process.env.LEVER_COMPANY_IDENTIFIER;
            const previousAshby = process.env.ASHBY_BOARD_NAME;
            process.env.GREENHOUSE_BOARD_TOKEN = "phase7-failure";
            delete process.env.LEVER_COMPANY_IDENTIFIER;
            delete process.env.ASHBY_BOARD_NAME;

            mockFetch(() =>
              Promise.resolve(
                new Response(
                  JSON.stringify({
                    jobs: [{
                      id: 1,
                      title: "Software Engineering Intern",
                      company_name: "Failure Test",
                      location: { name: "Hyderabad, India" },
                      absolute_url: "https://example.test/failure/1",
                    }],
                  }),
                  { status: 200 }
                )
              )
            );
            await runSync();

            mockFetch(() => Promise.reject(new Error("temporary outage")));
            const failed = await runSync();
            expect(failed.ok).toBe(false);
            expect(failed.sources[0].health.stale).toBe(false);

            const closed = await closeUnseenJobs([], failed.finishedAt, ["greenhouse:phase7-failure"]);
            expect(closed.closed).toBe(0);
            expect((await sourceJobRepository.findById("gh:phase7-failure:1"))?.status)
              .toBe("published");

            if (previousGreenhouse === undefined) delete process.env.GREENHOUSE_BOARD_TOKEN;
            else process.env.GREENHOUSE_BOARD_TOKEN = previousGreenhouse;
            if (previousLever === undefined) delete process.env.LEVER_COMPANY_IDENTIFIER;
            else process.env.LEVER_COMPANY_IDENTIFIER = previousLever;
            if (previousAshby === undefined) delete process.env.ASHBY_BOARD_NAME;
            else process.env.ASHBY_BOARD_NAME = previousAshby;
          });
        });

        const empty = await runSync();
        expect(empty.sources[0].health).toMatchObject({
          status: "empty_board",
          totalPostings: 0,
          internshipMatches: 0,
          indiaEligible: 0,
        });

        process.env.GREENHOUSE_BOARD_TOKEN = "non-india-board";
        const noIndia = await runSync();
        expect(noIndia.sources[0].health).toMatchObject({
          status: "no_india_eligible_internships",
          totalPostings: 1,
          internshipMatches: 1,
          indiaEligible: 0,
        });

        if (previousGreenhouse === undefined) delete process.env.GREENHOUSE_BOARD_TOKEN;
        else process.env.GREENHOUSE_BOARD_TOKEN = previousGreenhouse;
        if (previousLever === undefined) delete process.env.LEVER_COMPANY_IDENTIFIER;
        else process.env.LEVER_COMPANY_IDENTIFIER = previousLever;
        if (previousAshby === undefined) delete process.env.ASHBY_BOARD_NAME;
        else process.env.ASHBY_BOARD_NAME = previousAshby;
      });
    });

    const results = await Promise.all([
      fetchGreenhouseInternships("enterpret", { retries: 0 }),
      fetchGreenhouseInternships("hackerrank", { retries: 0 }),
    ]);

    expect(requestedUrls).toHaveLength(2);
    expect(results[0].internships[0].sourceId).toBe("gh:enterpret:1");
    expect(results[1].internships[0].sourceId).toBe("gh:hackerrank:2");
  });

  it("keeps the confirmed HackerRank internship and official application URL", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            jobs: [{
              id: 8229735,
              title: "Software Development Engineer Intern",
              company_name: "HackerRank",
              location: { name: "Onsite in Bangalore" },
              absolute_url: "https://job-boards.greenhouse.io/hackerrank/jobs/8229735",
              first_published: "2026-10-01T05:54:08-04:00",
            }],
          }),
          { status: 200 }
        )
      )
    );

    const result = await fetchGreenhouseInternships("hackerrank", { retries: 0 });

    expect(result.internships).toHaveLength(1);
    expect(result.internships[0].sourceId).toBe("gh:hackerrank:8229735");
    expect(result.internships[0].applicationUrl).toBe(
      "https://job-boards.greenhouse.io/hackerrank/jobs/8229735"
    );
  });

  it("converts source HTML and entities to safe readable text", () => {
    expect(
      stripHtml(
        '<h3>About Enterpret</h3><p class="isSelectedEnd">Build &amp; ship &lt;3.</p><script>alert("xss")</script>'
      )
    ).toBe("About Enterpret\n\nBuild & ship <3.");
  });

  it("removes unsafe markup and its contents", () => {
    expect(stripHtml("<style>.secret { display: none; }</style><p>Visible</p><!-- hidden -->"))
      .toBe("Visible");
  });

  it("returns empty jobs and an error when the board is not found", async () => {
    mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ jobs: [] }), { status: 404 }))
    );

    const res = await fetchGreenhouseJobs("bogus-board", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs).toEqual([]);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.summary).toContain("failed");
  });

  it("returns jobs with missing company.name recorded", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ jobs: [posting] }), { status: 200 })
      )
    );

    const res = await fetchGreenhouseJobs("acme-board", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs.length).toBe(1);
    const job = res.jobs[0];
    expect(job.sourceId).toBe(`gh:acme-board:999`);
    expect(job.title).toBe("Summer Intern");
    expect(job.missingFields).toContain("company.name");
  });

  it("records missing location when absent", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ jobs: [noLocPosting] }), { status: 200 })
      )
    );

    const res = await fetchGreenhouseJobs("no-loc-board", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs.length).toBe(1);
    expect(res.jobs[0].missingFields).toContain("location");
    expect(res.jobs[0].missingFields).toContain("company.name");
  });

  it("handles empty jobs array", async () => {
    mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ jobs: [] }), { status: 200 }))
    );

    const res = await fetchGreenhouseJobs("empty-board", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs).toEqual([]);
    expect(res.errors).toEqual([]);
  });

  it("keeps an empty live internship feed empty without fabricating listings", async () => {
    mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ jobs: [] }), { status: 200 }))
    );

    const res = await fetchGreenhouseInternships("empty-board", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs).toEqual([]);
    expect(res.internships).toEqual([]);
    expect(res.errors).toEqual([]);
  });

  it("times out and retries", async () => {
    // Two attempts, both reject with timeout. retries: 1 means 2 attempts total.
    let rejectedCount = 0;
    mockFetch(() => new Promise<never>((_, reject) => {
      rejectedCount += 1;
      setTimeout(() => reject(new Error("timeout")), 100);
    }));

    const res = await fetchGreenhouseJobs("slow-board", {
      timeout: 50,
      retries: 1,
    });

    expect(rejectedCount).toBe(2); // two fetch attempts
    expect(res.jobs).toEqual([]);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.summary).toContain("failed");
  });
});

describe("Lever connector configuration", () => {
  it("returns null when LEVER_COMPANY_IDENTIFIER is missing", () => {
    const prev = process.env.LEVER_COMPANY_IDENTIFIER;
    delete process.env.LEVER_COMPANY_IDENTIFIER;
    expect(getLeverCompanyId()).toBeNull();
    process.env.LEVER_COMPANY_IDENTIFIER = prev;
  });

  describe("Ashby connector", () => {
    it("skips missing board configuration", () => {
      const previous = process.env.ASHBY_BOARD_NAME;
      delete process.env.ASHBY_BOARD_NAME;
      expect(getAshbyBoardName()).toBeNull();
      process.env.ASHBY_BOARD_NAME = previous;
    });

    it("normalizes listed jobs and preserves stable and application URLs", async () => {
      let requestedUrl = "";
      mockFetch((input) => {
        requestedUrl = String(input);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              jobs: [{
                id: "job-123",
                title: "Software Engineering Intern",
                companyName: "Example Co",
                location: "Remote",
                descriptionPlain: "Build useful software.",
                publishedAt: "2026-01-01T00:00:00Z",
                jobUrl: "https://jobs.ashbyhq.com/example/job-123",
                applyUrl: "https://jobs.ashbyhq.com/example/job-123/application",
                employmentType: "Intern",
                isListed: true,
              }],
            }),
            { status: 200 }
          )
        );
      });

      const result = await fetchAshbyInternships("example-board", { retries: 0 });

      expect(requestedUrl).toBe(
        "https://api.ashbyhq.com/posting-api/job-board/example-board?includeCompensation=true"
      );
      expect(result.internships[0].sourceId).toBe("ashby:example-board:job-123");
      expect(result.internships[0].applicationUrl).toBe(
        "https://jobs.ashbyhq.com/example/job-123/application"
      );
      expect(result.internships[0].sourceUrl).toBe(
        "https://jobs.ashbyhq.com/example/job-123"
      );
      expect(result.internships[0].companyName).toBe("Example Co");
    });

    it("uses safe HTML descriptions and keeps missing fields explicit", async () => {
      mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({
          jobs: [{
            id: "job-456",
            title: "Product Intern",
            descriptionHtml: "<p>Learn &amp; build</p><script>alert(1)</script>",
          }],
        }), { status: 200 }))
      );

      const result = await fetchAshbyJobs("example-board", { retries: 0 });
      expect(result.jobs[0].description).toBe("Learn & build");
      expect(result.jobs[0].missingFields).toEqual([
        "company.name",
        "location",
        "applicationUrl",
        "publicationDate",
      ]);
    });

    it("excludes unlisted and non-internship jobs", async () => {
      mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({
          jobs: [
            { id: "hidden", title: "Hidden Intern", isListed: false },
            { id: "full-time", title: "Senior Engineer", isListed: true },
          ],
        }), { status: 200 }))
      );

      const result = await fetchAshbyInternships("example-board", { retries: 0 });
      expect(result.jobs).toHaveLength(1);
      expect(result.internships).toEqual([]);
    });

    it("handles empty, invalid, and failed responses without claiming success", async () => {
      mockFetch(() => Promise.resolve(new Response(JSON.stringify({ jobs: [] }), { status: 200 })));
      const empty = await fetchAshbyJobs("empty-board", { retries: 0 });
      expect(empty.jobs).toEqual([]);
      expect(empty.errors).toEqual([]);

      mockFetch(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
      const invalid = await fetchAshbyJobs("invalid-board", { retries: 0 });
      expect(invalid.jobs).toEqual([]);
      expect(invalid.errors.length).toBeGreaterThan(0);

      mockFetch(() => Promise.reject(new Error("network down")));
      const failed = await fetchAshbyJobs("failed-board", { retries: 0 });
      expect(failed.jobs).toEqual([]);
      expect(failed.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("Lever fetch error handling", () => {
  it("returns empty jobs and an error for unknown company", async () => {
    mockFetch(() => Promise.resolve(new Response(null, { status: 404 })));

    const res = await fetchLeverPostings("unknown-co", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs).toEqual([]);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("normalizes Lever postings with missing fields", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify([posting1, posting2]), { status: 200 })
      )
    );

    const res = await fetchLeverPostings("acme-co", {
      timeout: 2000,
      retries: 0,
    });

    expect(res.jobs.length).toBe(2);
    expect(res.jobs[0].sourceId).toBe("lever:acme-co:j1");
    expect(res.jobs[1].missingFields).toContain("title");
    expect(res.jobs[1].missingFields).toContain("location");
    expect(res.jobs[1].missingFields).toContain("applicationUrl");
  });
});

describe("loadSources and missingConfig", () => {
  it("loads multiple Greenhouse boards from the existing configuration variable", () => {
    const previous = process.env.GREENHOUSE_BOARD_TOKEN;
    process.env.GREENHOUSE_BOARD_TOKEN = "enterpret, hackerrank";

    expect(loadSources().filter((source) => source.type === "greenhouse")).toEqual([
      { type: "greenhouse", token: "enterpret", enabled: true },
      { type: "greenhouse", token: "hackerrank", enabled: true },
    ]);

    process.env.GREENHOUSE_BOARD_TOKEN = previous;
  });

  it("keeps Ashby configured separately from Greenhouse boards", () => {
    const previousGh = process.env.GREENHOUSE_BOARD_TOKEN;
    const previousAshby = process.env.ASHBY_BOARD_NAME;
    const previousLever = process.env.LEVER_COMPANY_IDENTIFIER;
    process.env.GREENHOUSE_BOARD_TOKEN = "enterpret,hackerrank";
    process.env.ASHBY_BOARD_NAME = "ashby";
    delete process.env.LEVER_COMPANY_IDENTIFIER;

    expect(loadSources()).toEqual([
      { type: "greenhouse", token: "enterpret", enabled: true },
      { type: "greenhouse", token: "hackerrank", enabled: true },
      { type: "ashby", token: "ashby", enabled: true },
    ]);

    process.env.GREENHOUSE_BOARD_TOKEN = previousGh;
    process.env.ASHBY_BOARD_NAME = previousAshby;
    if (previousLever === undefined) {
      delete process.env.LEVER_COMPANY_IDENTIFIER;
    } else {
      process.env.LEVER_COMPANY_IDENTIFIER = previousLever;
    }
  });

  it("returns no sources when env vars missing", () => {
    const prevGh = process.env.GREENHOUSE_BOARD_TOKEN;
    const prevLev = process.env.LEVER_COMPANY_IDENTIFIER;
    const prevAshby = process.env.ASHBY_BOARD_NAME;
    delete process.env.GREENHOUSE_BOARD_TOKEN;
    delete process.env.LEVER_COMPANY_IDENTIFIER;
    delete process.env.ASHBY_BOARD_NAME;

    expect(loadSources()).toEqual([]);
    expect(missingConfig().length).toBeGreaterThan(0);

    process.env.GREENHOUSE_BOARD_TOKEN = prevGh;
    process.env.LEVER_COMPANY_IDENTIFIER = prevLev;
    process.env.ASHBY_BOARD_NAME = prevAshby;
  });

  describe("India eligibility and cross-source deduplication", () => {
    it("requires an India location signal for remote eligibility", () => {
      expect(isIndiaEligibleLocation("Bengaluru, India")).toBe(true);
      expect(isIndiaEligibleLocation("Remote - India")).toBe(true);
      expect(isIndiaEligibleLocation("Remote - United States")).toBe(false);
      expect(isIndiaEligibleLocation("Remote")).toBe(false);
    });

    it("removes duplicate postings by official URL and fallback identity", () => {
      const base = {
        sourceType: "greenhouse" as const,
        boardToken: "board",
        title: "Software Intern",
        companyName: "Example Labs",
        location: "Pune, India",
        description: "Build things.",
        applicationUrl: "https://example.test/jobs/intern",
        publishedAt: "2026-01-01T00:00:00Z",
        firstSeenAt: "2026-01-01T00:00:00Z",
        lastVerifiedAt: "2026-01-01T00:00:00Z",
        lastChangedAt: "2026-01-01T00:00:00Z",
        status: "published" as const,
        missingFields: [],
        raw: {},
      };

      const duplicate = {
        ...base,
        sourceType: "ashby" as const,
        sourceId: "ashby:board:1",
      };
      const unique = {
        ...base,
        sourceId: "gh:board:2",
        applicationUrl: "https://example.test/jobs/other",
      };

      expect(
        deduplicateNormalizedJobs([
          { ...base, sourceId: "gh:board:1" },
          duplicate,
          unique,
        ])
      ).toHaveLength(2);
    });

    it("deduplicates the same Greenhouse posting returned by two configured boards", () => {
      const job = {
        sourceType: "greenhouse" as const,
        sourceId: "gh:first:123",
        boardToken: "first",
        title: "Software Engineering Intern",
        companyName: "Example Labs",
        location: "Bengaluru, India",
        description: "Build things.",
        applicationUrl: "https://job-boards.greenhouse.io/example/jobs/123",
        publishedAt: "2026-01-01T00:00:00Z",
        firstSeenAt: "2026-01-01T00:00:00Z",
        lastVerifiedAt: "2026-01-01T00:00:00Z",
        lastChangedAt: "2026-01-01T00:00:00Z",
        status: "published" as const,
        missingFields: [],
        raw: {},
      };

      expect(
        deduplicateNormalizedJobs([
          job,
          { ...job, sourceId: "gh:second:123", boardToken: "second" },
        ])
      ).toHaveLength(1);
    });
  });
});

const posting = {
  id: 999,
  title: "Summer Intern",
  absolute_url: "https://boards.greenhouse.io/x/jobs/999",
  location: { name: "New York, NY" },
  content: "<p>Great role</p>",
  created_at: "2026-01-01T00:00:00Z",
};

const noLocPosting = {
  id: 100,
  title: "Intern",
  absolute_url: "https://boards.greenhouse.io/x/jobs/100",
  location: null,
  content: null,
  created_at: null,
};

const posting1 = {
  id: "j1",
  title: "Eng Intern",
  location: "Remote",
  applyUrl: "https://example.com/apply/j1",
  description: "Build things",
  createdAt: Date.now(),
};

const posting2 = {
  id: "j2",
  description: "No fields",
};
