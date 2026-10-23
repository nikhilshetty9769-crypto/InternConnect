/**
 * Ashby public job-board connector.
 *
 * Endpoint:
 *   GET https://api.ashbyhq.com/posting-api/job-board/{boardName}?includeCompensation=true
 *
 * Reads the board identifier from ASHBY_BOARD_NAME and never invents one.
 */

import { isInternshipPosting, stripHtml } from "@/lib/sources/greenhouse";
import type { SourceType } from "@/lib/sources/types";

export interface AshbyJob {
  id?: string;
  title?: string;
  companyName?: string;
  organizationName?: string;
  location?: string;
  locations?: string[];
  secondaryLocations?: Array<{ location?: string } | string>;
  descriptionPlain?: string;
  descriptionHtml?: string;
  publishedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
  applicationUrl?: string;
  employmentType?: string;
  isListed?: boolean;
  [key: string]: unknown;
}

export interface AshbyNormalized {
  sourceType: SourceType;
  sourceId: string;
  boardName: string;
  title: string;
  companyName: string | null;
  location: string | null;
  description: string | null;
  sourceUrl: string | null;
  applicationUrl: string | null;
  publicationDate: string | null;
  status: "published";
  missingFields: string[];
  raw: Record<string, unknown>;
}

export function getAshbyBoardName(): string | null {
  const boardName = process.env.ASHBY_BOARD_NAME;
  if (!boardName || boardName.trim() === "" || boardName === "REPLACE_ME") {
    return null;
  }
  return boardName.trim();
}

function timeoutMs(duration: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), duration)
  );
}

function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolveLocation(job: AshbyJob): string | null {
  const location = firstNonEmpty(job.location);
  if (location) return location;

  if (Array.isArray(job.locations)) {
    const locations = job.locations.filter(
      (value): value is string => typeof value === "string" && value.trim() !== ""
    );
    if (locations.length > 0) return locations.join(", ");
  }

  if (Array.isArray(job.secondaryLocations)) {
    const locations = job.secondaryLocations
      .map((value) => (typeof value === "string" ? value : value.location))
      .filter((value): value is string => Boolean(value?.trim()));
    if (locations.length > 0) return locations.join(", ");
  }

  return null;
}

export function normalizeAshbyJob(job: AshbyJob, boardName: string): AshbyNormalized | null {
  if (!job.id || job.id.trim() === "") return null;

  const missingFields: string[] = [];
  const title = firstNonEmpty(job.title);
  if (!title) missingFields.push("title");

  const companyName = firstNonEmpty(job.companyName, job.organizationName);
  if (!companyName) missingFields.push("company.name");

  const location = resolveLocation(job);
  if (!location) missingFields.push("location");

  const description =
    firstNonEmpty(job.descriptionPlain) ?? stripHtml(job.descriptionHtml);
  if (!description) missingFields.push("description");

  const applicationUrl = firstNonEmpty(job.applyUrl, job.applicationUrl, job.jobUrl);
  if (!applicationUrl) missingFields.push("applicationUrl");

  const sourceUrl = firstNonEmpty(job.jobUrl);

  const publicationDate = firstNonEmpty(job.publishedAt);
  if (!publicationDate) missingFields.push("publicationDate");

  return {
    sourceType: "ashby",
    sourceId: `ashby:${boardName}:${job.id}`,
    boardName,
    title: title ?? "Untitled",
    companyName,
    location,
    description,
    sourceUrl,
    applicationUrl,
    publicationDate,
    status: "published",
    missingFields,
    raw: job as Record<string, unknown>,
  };
}

export async function fetchAshbyJobs(
  boardName: string,
  opts?: { timeout?: number; retries?: number }
): Promise<{ jobs: AshbyNormalized[]; errors: string[]; summary: string }> {
  const errors: string[] = [];
  const jobs: AshbyNormalized[] = [];
  const timeout = opts?.timeout ?? 8000;
  const maxRetries = opts?.retries ?? 1;

  if (!boardName || boardName.trim() === "") {
    errors.push("ASHBY_BOARD_NAME is empty or missing.");
    return { jobs, errors, summary: "No Ashby board configured." };
  }

  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
    boardName
  )}?includeCompensation=true`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await Promise.race([fetch(url), timeoutMs(timeout)]);
      if (!response.ok) {
        const message = `Ashby HTTP ${response.status} for board ${boardName}`;
        if (attempt === maxRetries) errors.push(message);
        continue;
      }

      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !Array.isArray((data as { jobs?: unknown }).jobs)) {
        errors.push(`Ashby returned an invalid response for board ${boardName}`);
        break;
      }

      for (const rawJob of (data as { jobs: unknown[] }).jobs) {
        if (!rawJob || typeof rawJob !== "object") continue;
        const job = rawJob as AshbyJob;
        if (job.isListed === false) continue;
        const normalized = normalizeAshbyJob(job, boardName);
        if (normalized) jobs.push(normalized);
      }

      return {
        jobs,
        errors,
        summary: `Ashby board ${boardName}: ${jobs.length} listed postings fetched, ${errors.length} errors.`,
      };
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        errors.push(
          `Ashby fetch error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  return {
    jobs,
    errors,
    summary: `Ashby board ${boardName}: failed after ${maxRetries + 1} attempts. ${errors.length} errors.`,
  };
}

export async function fetchAshbyInternships(
  boardName: string,
  opts?: { timeout?: number; retries?: number }
): Promise<{
  jobs: AshbyNormalized[];
  internships: AshbyNormalized[];
  errors: string[];
  summary: string;
}> {
  const result = await fetchAshbyJobs(boardName, opts);
  const internships = result.jobs.filter((job) =>
    isInternshipPosting({
      title: job.title,
      employment_type: job.raw.employmentType as string | undefined,
    })
  );

  return {
    ...result,
    internships,
    summary: `Ashby board ${boardName}: ${internships.length} internships out of ${result.jobs.length} listed postings.`,
  };
}
