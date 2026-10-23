/**
 * InternConnect — Job Data Access Layer
 *
 * A thin, stable interface over the job catalogue. Today it is backed by the
 * local demo dataset, which keeps the app fully usable without any database
 * credentials. A future MongoDB-backed implementation can satisfy the same
 * `JobRepository` contract without touching the UI.
 *
 * Every record served here is fictional demo data.
 */

import { DEMO_JOBS, type Job } from "@/lib/demo-data";
import { sourceJobRepository } from "@/lib/sources/repository";
import type { NormalizedJob } from "@/lib/sources/types";

export function getListingSourceCounts(jobs: Job[]): {
  total: number;
  demo: number;
  live: number;
} {
  const live = jobs.filter((job) => !job.isDemo).length;
  return { total: jobs.length, demo: jobs.length - live, live };
}

export function decodeJobRouteId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

/**
 * The contract any job source must satisfy. Swapping the demo dataset for a
 * database only requires a new implementation of this interface.
 */
export interface JobRepository {
  listJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
}

/** The current implementation: the in-repo demo dataset. */
export const demoJobRepository: JobRepository = {
  async listJobs() {
    return DEMO_JOBS;
  },
  async getJob(id: string) {
    return DEMO_JOBS.find((job) => job.id === id) ?? null;
  },
};

/**
 * The repository the app uses. Swap this line to point at a real database
 * implementation later; nothing else in the codebase needs to change.
 */
export const jobRepository: JobRepository = demoJobRepository;

/* -------------------------------------------------------------------------- */
/* Canonical job resolution (Phase 9.1)                                         */
/* -------------------------------------------------------------------------- */

/**
 * The outcome of resolving a saved/tracked job ID.
 *
 * `job` is null when the ID no longer resolves to any known listing. We keep
 * the ID so the UI can show a clear "no longer available" state instead of
 * silently dropping the user's saved record.
 */
export interface ResolvedJob {
  id: string;
  job: Job | null;
}

/**
 * Resolves job IDs to jobs using the canonical data-access layer.
 *
 * This is the single lookup used by the Saved page, the Applications page, and
 * the Dashboard, so all three agree on what a job ID means.
 *
 * IDs are stable strings (demo: "job-3"; real source: "gh:board:123"), never
 * list positions. Unknown IDs resolve to `job: null` rather than throwing.
 *
 * Real-source jobs are converted into the `Job` shape WITHOUT being relabelled
 * as demo data — `isDemo` stays false and the demo badge is not shown.
 */
/* -------------------------------------------------------------------------- */
/* Real-source conversion to Job shape (Phase 9.1)                            */
/* -------------------------------------------------------------------------- */

/**
 * Convert a verified real-source posting into the canonical Job shape.
 * Real jobs keep `isDemo: false`; no demo badge should render.
 * Fields the source did not provide stay missing — never fabricated.
 */
export function normalizedSourceToJob(source: NormalizedJob): Job {
  return {
    id: source.sourceId,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl ?? source.applicationUrl ?? undefined,
    title: source.title,
    role: (source.raw?.category as string) ?? "",
    company: {
      name: source.companyName ?? "",
      logo: "🏢",
      description: source.description ?? "",
      website: source.applicationUrl ? getSourceOrigin(source.applicationUrl) : undefined,
      size: undefined,
      industry: undefined,
    },
    location: source.location ?? "",
    remote: (source.location ?? "").toLowerCase().includes("remote"),
    type: "Internship" as Job["type"],
    employmentType: (source.raw?.employment_type as Job["employmentType"]) || undefined,
    paid: source.raw?.paid === false ? false : (source.raw?.paid === true ? true : undefined),
    compensation: undefined,
    posted: source.publishedAt ?? source.firstSeenAt,
    deadline: undefined,
    isDemo: false,
    responsibilities: [],
    eligibility: [],
    skills: (source.raw?.tags as string[] ?? []),
    description: source.description ?? "",
    applicationLink: source.applicationUrl ?? "",
    applicants: undefined,
  };
}

function getSourceOrigin(sourceUrl: string): string | undefined {
  try {
    return new URL(sourceUrl).origin;
  } catch {
    return undefined;
  }
}

function realToJob(stored: import("@/lib/sources/repository").StoredSourceJob): Job {
  return normalizedSourceToJob(stored);
}

export async function resolveJobs(ids: string[]): Promise<ResolvedJob[]> {
  // De-duplicate while preserving the caller's order.
  const unique = Array.from(new Set(ids));

  const resolved = await Promise.all(
    unique.map(async (id): Promise<ResolvedJob> => {
      const demoJob = DEMO_JOBS.find((j) => j.id === id) ?? null;
      if (demoJob) return { id, job: demoJob };

      // Check real-source storage (Phase 8 connectors) before falling back.
      try {
        const stored = await sourceJobRepository.findById(id);
        if (stored) return { id, job: realToJob(stored) };
      } catch {
        // Source repository unavailable — fall through.
      }

      const repoJob = await jobRepository.getJob(id);
      if (repoJob) return { id, job: repoJob };

      return { id, job: null };
    })
  );

  return resolved;
}

/**
 * Convenience wrapper returning only the jobs that still resolve.
 * Use `resolveJobs` when you also need to detect missing IDs.
 */
export async function resolveExistingJobs(ids: string[]): Promise<Job[]> {
  const resolved = await resolveJobs(ids);
  return resolved.map((r) => r.job).filter((j): j is Job => j !== null);
}

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

export type JobQuery = {
  query?: string;
  role?: string;
  location?: string;
  remote?: string;
  type?: string;
  paid?: string;
  skill?: string;
};

/**
 * Returns the jobs matching a query, most relevant first.
 *
 * Relevance is a plain weighted match over title, company, role and skills —
 * deterministic and explainable, not a machine-learning score.
 */
export function queryJobs(jobs: Job[], q: JobQuery): Job[] {
  const query = q.query?.trim().toLowerCase() ?? "";

  return jobs.filter((job) => {
    if (query) {
      const haystack = [
        job.title,
        job.company.name,
        job.role,
        job.description,
        job.location,
        job.employmentType,
        ...job.skills,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    if (q.role && q.role !== "all" && job.role !== q.role) return false;

    if (q.location && q.location !== "all") {
      const matchesLocation =
        job.location === q.location ||
        (q.location === "Remote" && job.remote);
      if (!matchesLocation) return false;
    }

    if (q.remote === "remote" && !job.remote) return false;
    if (q.remote === "onsite" && job.remote) return false;

    if (q.type && q.type !== "all" && job.type !== q.type) return false;

    if (q.paid === "paid" && !job.paid) return false;
    if (q.paid === "unpaid" && job.paid) return false;

    if (q.skill && q.skill !== "all" && !job.skills.includes(q.skill)) {
      return false;
    }

    return true;
  });
}

/**
 * Scores a job against a search query so the most relevant listings surface
 * first. Higher is a better match. Deterministic and explainable.
 */
export function relevanceScore(job: Job, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;

  const terms = query.split(/\s+/).filter(Boolean);
  let score = 0;

  for (const term of terms) {
    if (job.title.toLowerCase().includes(term)) score += 6;
    if (job.company.name.toLowerCase().includes(term)) score += 5;
    if (job.role.toLowerCase().includes(term)) score += 4;
    if (job.skills.some((s) => s.toLowerCase().includes(term))) score += 3;
    if (job.description.toLowerCase().includes(term)) score += 1;
  }

  return score;
}

/**
 * Normalised compensation for sorting. Hourly and yearly figures are not
 * comparable, so this deliberately buckets by period and only compares within
 * the same unit. Returns 0 when the record carries no usable compensation.
 */
export function compensationSortValue(job: Job): number {
  if (!job.paid || !job.compensation) return 0;
  const { min, max, period } = job.compensation;
  const midpoint = (min + max) / 2;

  switch (period) {
    case "hour":
      return midpoint;
    case "month":
      return midpoint / 1000;
    case "year":
      return midpoint / 100000;
    default:
      return 0;
  }
}

/**
 * Sorts jobs by the selected option. Returns a new array; the input is left
 * untouched.
 */
export function sortJobs(
  jobs: Job[],
  sort: string,
  query: string = ""
): Job[] {
  const sorted = [...jobs];

  switch (sort) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.posted).getTime() - new Date(a.posted).getTime()
      );
      break;
    case "deadline":
      sorted.sort(
        (a, b) =>
          (a.deadline ? new Date(a.deadline).getTime() : Infinity) -
          (b.deadline ? new Date(b.deadline).getTime() : Infinity)
      );
      break;
    case "compensation":
      sorted.sort((a, b) => compensationSortValue(b) - compensationSortValue(a));
      break;
    case "relevance":
    default:
      sorted.sort((a, b) => {
        const diff =
          relevanceScore(b, query) - relevanceScore(a, query);
        if (diff !== 0) return diff;
        return (
          new Date(b.posted).getTime() - new Date(a.posted).getTime()
        );
      });
      break;
  }

  return sorted;
}

/**
 * Jobs related to the given one, matched on shared skills or the same role.
 * Used for the "related opportunities" section on a job detail page.
 */
export function relatedJobs(
  job: Job,
  allJobs: Job[],
  limit: number = 3
): Job[] {
  const jobSkills = new Set(job.skills);

  return allJobs
    .filter((candidate) => candidate.id !== job.id)
    .map((candidate) => {
      const sharedSkills = candidate.skills.filter((s) => jobSkills.has(s));
      const sameRole = candidate.role === job.role;
      return {
        candidate,
        score: sharedSkills.length * 2 + (sameRole ? 3 : 0),
        sharedSkills,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
