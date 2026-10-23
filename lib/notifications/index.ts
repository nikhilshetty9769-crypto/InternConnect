/**
 * InternConnect — Notifications foundation (Phase 8)
 *
 * A clean extension point for future notification features. Nothing here
 * sends emails or claims delivery — no provider is configured.
 *
 * Extension points:
 *  1. New opportunity discovered (from sync results).
 *  2. Saved-search matching (profile-driven rule matching).
 *  3. In-app notification feed (local storage).
 *  4. Email alerts — future phase, requires a real provider.
 *
 * Email delivery is intentionally NOT implemented. No SMTP/provider is
 * configured, and claiming email delivery would be false.
 */

import type { NormalizedJob } from "@/lib/sources/types";

export type NotificationKind =
  | "new_opportunity"
  | "saved_search_match"
  | "status_change";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  jobId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationRule {
  /** Only notify for roles the student selected. Empty = all roles. */
  roles?: string[];
  /** Only notify for these locations. Empty = all locations. */
  locations?: string[];
  /** Only notify for these skills. Empty = all skills. */
  skills?: string[];
  /** Only notify when the posting is newer than this many days. */
  maxAgeDays?: number;
}

/**
 * Matches a job against a rule set. Pure and deterministic — no ML involved.
 */
export function matchesRule(job: NormalizedJob, rule: NotificationRule): boolean {
  if (rule.roles?.length) {
    const title = job.title.toLowerCase();
    if (!rule.roles.some((r) => title.includes(r.toLowerCase()))) return false;
  }

  if (rule.locations?.length) {
    const loc = (job.location ?? "").toLowerCase();
    if (!rule.locations.some((l) => loc.includes(l.toLowerCase()))) return false;
  }

  if (rule.skills?.length) {
    const haystack = [job.title, job.description ?? "", ...(job.raw?.tags as string[] ?? [])]
      .join(" ")
      .toLowerCase();
    if (!rule.skills.some((s) => haystack.includes(s.toLowerCase()))) return false;
  }

  if (rule.maxAgeDays != null && job.publishedAt) {
    const ageDays = (Date.now() - new Date(job.publishedAt).getTime()) / 86_400_000;
    if (ageDays > rule.maxAgeDays) return false;
  }

  return true;
}

/**
 * Builds notification records for newly discovered jobs.
 * Returns plain data — the caller decides where to store it.
 */
export function buildNewOpportunityNotifications(
  jobs: NormalizedJob[]
): AppNotification[] {
  const now = new Date().toISOString();
  return jobs.map((job) => ({
    id: `n-${job.sourceId}-${now}`,
    kind: "new_opportunity" as const,
    jobId: job.sourceId,
    title: `New opportunity: ${job.title}`,
    body: `${job.companyName ?? "A new posting"}${
      job.location ? ` · ${job.location}` : ""
    }`,
    createdAt: now,
    read: false,
  }));
}

/**
 * Email alerts are NOT implemented. This function exists so callers get a
 * clear "not configured" signal instead of silently doing nothing.
 */
export function sendEmailAlert(): { sent: false; reason: string } {
  return {
    sent: false,
    reason:
      "No email provider is configured. Set up a provider before enabling email alerts.",
  };
}
