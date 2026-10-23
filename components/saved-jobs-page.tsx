"use client";

import * as React from "react";
import Link from "next/link";
import { BookmarkCheck, Trash2, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import { resolveJobs, type ResolvedJob } from "@/lib/data/jobs";
import type { Job } from "@/lib/types";
import { formatCompensation } from "@/lib/utils";

export function SavedJobsClient() {
  const { savedIds, toggleSaved, hydrated } = useSavedJobs();
  const [resolved, setResolved] = React.useState<ResolvedJob[]>([]);
  const [resolving, setResolving] = React.useState(false);

  // Resolve saved IDs through the canonical data-access layer so a saved job
  // from ANY source (demo or real) is found by its stable ID.
  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    queueMicrotask(() => setResolving(true));
    resolveJobs(savedIds)
      .then((result) => {
        if (!cancelled) setResolved(result);
      })
      .catch(() => {
        if (!cancelled) setResolved(savedIds.map((id) => ({ id, job: null })));
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [savedIds, hydrated]);

  const savedJobs: ResolvedJob[] = resolved.filter((r) => r.job !== null);
  const missingJobs: ResolvedJob[] = resolved.filter((r) => r.job === null);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center animate-pulse-soft">
        <p className="text-sm text-muted-foreground">Loading saved jobs...</p>
      </div>
    );
  }

  if (savedIds.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-10 text-center space-y-4">
        <BookmarkCheck className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
        <h2 className="text-lg font-bold text-foreground">No saved opportunities yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Save internships and entry-level roles you like, then return here to review them.
        </p>
        <Link
          href="/#listings"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-xl hover:shadow-primary/30"
        >
          <Sparkles className="h-4 w-4" />
          Discover opportunities
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Saved job listings" className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Showing {savedJobs.length} saved {savedJobs.length === 1 ? "opportunity" : "opportunities"}
        {missingJobs.length > 0 ? ` · ${missingJobs.length} no longer available` : ""}
      </p>

      {resolving && savedJobs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center animate-pulse-soft">
          <p className="text-sm text-muted-foreground">Loading saved jobs...</p>
        </div>
      ) : (
        <>
          {savedJobs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map(({ id, job }) => (
                <SavedJobCard key={id} job={job!} onRemove={() => toggleSaved(id)} />
              ))}
            </div>
          )}

          {missingJobs.length > 0 && (
            <div className="rounded-2xl border border-warning/30 bg-card shadow-sm">
              <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {missingJobs.length} saved {missingJobs.length === 1 ? "listing is" : "listings are"} no longer available
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These IDs are still saved in your browser, but they no longer match any
                    listing. You can remove them below.
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {missingJobs.map(({ id }) => (
                  <li key={id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <span className="truncate font-mono text-xs text-muted-foreground">{id}</span>
                    <button
                      onClick={() => toggleSaved(id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:border-danger/40 hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SavedJobCard({ job, onRemove }: { job: Job; onRemove: () => void }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            <Link href={`/job/${job.id}`} className="hover:text-primary focus-visible:outline-none">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company.name}</p>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
          aria-label={`Remove ${job.title} from saved jobs`}
          title="Remove from saved"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground">{job.type}</span>
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          job.employmentType === "Remote" ? "bg-primary-soft text-primary border-primary/20" :
          job.employmentType === "Hybrid" ? "bg-accent/10 text-accent border-accent/20" :
          "bg-secondary text-secondary-foreground border-border"
        }`}>{job.employmentType ?? "Not specified"}</span>
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          job.paid === undefined ? "bg-secondary text-secondary-foreground border-border" :
          job.paid ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
        }`}>
          {job.paid === undefined ? "Not specified" : job.paid ? "Paid" : "Unpaid"}
        </span>
        {job.isDemo && <span className="demo-badge">Demo data</span>}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not specified"}</span>
        <span>{formatCompensation(job.compensation, job.paid)}</span>
      </div>
    </article>
  );
}
