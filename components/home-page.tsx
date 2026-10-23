"use client";

import * as React from "react";
import { Search, Target, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { FilterPanel } from "@/components/filter-panel";
import { JobCard } from "@/components/job-card";
import { JobCardSkeleton } from "@/components/job-card-skeleton";
import { Suspense } from "react";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import { RoleFilterSync } from "@/components/role-filter-sync";
import { DEFAULT_FILTERS, type JobFilters, type Job } from "@/lib/types";
import { getListingSourceCounts, queryJobs, sortJobs } from "@/lib/data/jobs";

const CATEGORIES = [
  { key: "Software Engineering", label: "Software Engineering" },
  { key: "Product Management", label: "Product Management" },
  { key: "Data Science", label: "Data Science" },
  { key: "UX Design", label: "UX Design" },
  { key: "Marketing", label: "Marketing" },
  { key: "Cybersecurity", label: "Cybersecurity" },
];

export default function HomePage({
  jobs,
  liveSourceError,
}: {
  jobs: Job[];
  liveSourceError: boolean;
}) {
  const [filters, setFilters] = React.useState<JobFilters>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = React.useState<JobFilters>(DEFAULT_FILTERS);
  const { savedIds, hydrated } = useSavedJobs();

  // Debounce the query so typing feels responsive without re-filtering on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, filters.query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [filters]);

  const allJobs = React.useMemo(() => jobs, [jobs]);
  const filtered = React.useMemo(() => {
    const results = queryJobs(allJobs, debouncedFilters);
    return sortJobs(results, debouncedFilters.sort, debouncedFilters.query);
  }, [allJobs, debouncedFilters]);

  const count = filtered.length;
  const isSearching = filters.query !== debouncedFilters.query;
  const savedCount = hydrated ? savedIds.length : 0;
  const sourceCounts = getListingSourceCounts(filtered);
  const sourceSummary = sourceCounts.live > 0 && sourceCounts.demo > 0
    ? `${sourceCounts.live} verified · ${sourceCounts.demo} demo`
    : sourceCounts.live > 0
      ? `${sourceCounts.live} verified`
      : `${sourceCounts.demo} demo`;

  // Stable callback so the URL-driven role sync doesn't loop.
  const applyUrlRole = React.useCallback((role: string) => {
    setFilters((prev) => (prev.role === role ? prev : { ...prev, role }));
  }, []);

  return (
    <>
      {/* Applies a ?role= deep link (category links, job-detail breadcrumbs). */}
      <Suspense fallback={null}>
        <RoleFilterSync onRole={applyUrlRole} />
      </Suspense>

      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
        <Hero />
      </div>

      {/* Quick category links */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8" aria-label="Role categories">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Browse by role</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/?role=${encodeURIComponent(cat.key)}#listings`}
              className={`depth-badge rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary ${
                filters.role === cat.key
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8" aria-label="Platform features">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={Target} title="Precision filters" description="Narrow results by role, skill, location, work model, employment type, and pay." />
          <Feature icon={Zap} title="Fast discovery" description="A clean, responsive interface that keeps the signal high on any device." />
          <Feature icon={ShieldCheck} title="Honest labels" description="Every listing carries a clear demo-data badge so you always know what's real." />
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Open Opportunities</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {liveSourceError && sourceCounts.live === 0
                ? "Live opportunities are temporarily unavailable; showing demo listings."
                : "Verified and demo internship opportunities."}{" "}
              ({count} shown · {sourceSummary} · {savedCount} saved).
            </p>
          </div>
        </div>

        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={count}
          sourceSummary={sourceSummary}
        />

        <div className="mt-6">
          {isSearching ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No opportunities match your filters</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try broadening your search — remove a filter or use a different keyword. This is demo data with a limited sample of listings.
              </p>
              <button
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured opportunities */}
      {count > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8" aria-label="Featured opportunities">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Featured opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 3).map((job) => (
              <FeaturedCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8" aria-label="How it works">
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { step: "1", title: "Search and filter", body: "Narrow demo listings by role, skill, location, work model, and pay." },
            { step: "2", title: "Save what interests you", body: "Bookmark opportunities to review them later from your saved jobs page." },
            { step: "3", title: "Track your progress", body: "Record where you are in the process — locally, on your own device." },
          ].map((s) => (
            <li key={s.step} className="depth-surface depth-card rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{s.step}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function FeaturedCard({ job }: { job: Job }) {
  return (
    <Link href={`/job/${job.id}`} className="depth-surface depth-card group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary">{job.title}</h3>
        <span className={job.isDemo
          ? "demo-badge shrink-0"
          : "shrink-0 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"}>
          {job.isDemo ? "Demo" : "Verified"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{job.company.name || "Company not specified"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">{job.type}</span>
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-primary-soft text-primary">{job.employmentType}</span>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{job.location} · Deadline {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not specified"}</div>
    </Link>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof Target; title: string; description: string }) {
  return (
    <div className="depth-surface depth-card rounded-xl border border-border bg-card p-5 shadow-sm">
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
