import { Sparkles, Clock, ExternalLink, ShieldCheck, AlertCircle, TriangleAlert, MapPin } from "lucide-react";
import { loadSources, fetchConfiguredInternships } from "@/lib/sources/sync";
import { stripHtml } from "@/lib/sources/greenhouse";
import Link from "next/link";

function truncateDescription(description: string, maxLength = 280): string {
  const text = stripHtml(description) ?? "";
  if (text.length <= maxLength) return text;

  const cutoff = text.slice(0, maxLength + 1);
  const lastSpace = cutoff.lastIndexOf(" ");
  return `${cutoff.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`;
}

export default async function LatestOpportunitiesPage() {
  const sources = loadSources();

  // No source configured at all — the board token is missing from the server
  // environment. Report the exact variables required; never guess a board.
  if (sources.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">No verified sources configured</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            To see real listings, configure at least one source:
            <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">GREENHOUSE_BOARD_TOKEN</code> or
            <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">LEVER_COMPANY_IDENTIFIER</code> or
            <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">ASHBY_BOARD_NAME</code>.
          </p>
        </div>
      </div>
    );
  }

  const fetched = await fetchConfiguredInternships();
  const sourceErrors = fetched.errors.join("; ");

  // The fetched jobs are displayed directly; persisting them is a side
  // effect handled by the sync endpoint, not required for rendering.
  const jobs: import("@/lib/sources/types").NormalizedJob[] = fetched.jobs;
  const recentReference = Date.parse(fetched.lastSuccessfulRefreshAt ?? "");
  const recentCutoff = recentReference - 30 * 86_400_000;
  const recentlyAdded = jobs
    .filter((job) => {
      const published = job.publishedAt ? new Date(job.publishedAt).getTime() : NaN;
      return Number.isFinite(recentReference) &&
        Number.isFinite(published) &&
        published <= recentReference &&
        published >= recentCutoff;
    })
    .sort((a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? ""))
    .slice(0, 6);
  const staleSources = fetched.sourceHealth.filter((source) => source.stale);

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-3">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">No verified internship listings yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {sources.length} source{sources.length === 1 ? " is" : "s are"} configured, but no internship
            postings were returned. Trigger a manual sync at{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/api/internal/sync</code>.
          </p>
          <p className="text-xs text-muted-foreground">
            Last successful refresh:{" "}
            {fetched.lastSuccessfulRefreshAt
              ? new Date(fetched.lastSuccessfulRefreshAt).toLocaleString("en-US")
              : "None recorded"}
          </p>
          <div className="text-xs text-muted-foreground">
            {fetched.sourceHealth.map((source) => (
              <p key={`${source.sourceType}:${source.token}`}>
                {source.sourceType} ({source.token}): {source.status}
                {source.stale ? " · stale" : ""}
              </p>
            ))}
          </div>
          {sourceErrors ? (
            <p className="text-xs text-warning">Source errors: {sourceErrors}</p>
          ) : null}

          <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <p>
              Last successful refresh:{" "}
              {fetched.lastSuccessfulRefreshAt
                ? new Date(fetched.lastSuccessfulRefreshAt).toLocaleString("en-US")
                : "No successful refresh recorded"}
            </p>
            {staleSources.length > 0 ? (
              <p className="mt-1 text-warning">
                Some sources are stale or have not completed a successful refresh.
              </p>
            ) : null}
          </div>

          {recentlyAdded.length > 0 ? (
            <section className="mb-8" aria-labelledby="recently-added-heading">
              <div className="mb-3 flex items-center gap-2">
                <h2 id="recently-added-heading" className="text-xl font-bold text-foreground">
                  Recently Added
                </h2>
                <span className="text-xs text-muted-foreground">Published in the last 30 days</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recentlyAdded.map((job) => (
                  <Link
                    key={job.sourceId}
                    href={`/job/${encodeURIComponent(job.sourceId)}`}
                    className="depth-surface rounded-xl border border-primary/20 bg-card p-4 text-sm hover:border-primary/50"
                  >
                    <span className="font-semibold text-foreground">{job.title}</span>
                    <span className="mt-1 block text-muted-foreground">
                      {job.companyName ?? "Company not in source"} · Published{" "}
                      {new Date(job.publishedAt ?? "").toLocaleDateString("en-US")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Latest Opportunities</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified internship postings from configured career boards ({jobs.length} shown). Each listing
            carries its source attribution and a verification timestamp.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Real data
        </span>
      </div>

      {sourceErrors ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Some sources reported errors: {sourceErrors}</span>
        </div>
      ) : null}

      <div className="mb-6 text-xs text-muted-foreground">
        {fetched.sourceHealth.map((source) => (
          <span key={`${source.sourceType}:${source.token}`} className="mr-4">
            {source.sourceType} ({source.token}): {source.status}
            {source.stale ? " · stale" : ""}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <article
            key={job.sourceId}
            className="depth-surface depth-card group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground leading-tight">
                <Link href={`/job/${encodeURIComponent(job.sourceId)}`} className="hover:text-primary">
                  {job.title}
                </Link>
              </h3>
              <span className="shrink-0 rounded-full bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Verified</span>
            </div>
            <p className="text-sm text-muted-foreground">{job.companyName ?? "Company not in source"}</p>

            {job.location && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {job.location}
              </p>
            )}

            {job.description && (
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                {truncateDescription(job.description)}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Published {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString("en-US") : "—"}
              </span>
              <span>Source: {job.sourceType}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              Last verified: {new Date(job.lastVerifiedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>

            {job.applicationUrl ? (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                aria-label={`Apply at ${job.title}`}
              >
                Apply <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="inline-flex rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">No direct link</span>
            )}

            {job.missingFields.length > 0 && (
              <p className="text-[11px] text-warning">Missing from source: {job.missingFields.join(", ")}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
