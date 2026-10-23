"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, MapPin, Clock, Users, IndianRupee } from "lucide-react";
import type { Job } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import {
  cn,
  formatCompensation,
  formatRelativeDate,
  EMPLOYMENT_TYPE_COLORS,
  JOB_TYPE_COLORS,
} from "@/lib/utils";

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const { isSaved, toggleSaved, hydrated } = useSavedJobs();
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setNow(new Date()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saved = hydrated && isSaved(job.id);

  return (
    <article
      className={cn(
        "depth-surface depth-card group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Company logo */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-2xl"
          aria-hidden="true"
        >
          {job.company.logo ?? "🏢"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight text-foreground">
                <Link
                  href={`/job/${job.id}`}
                  className="after:absolute after:inset-0 after:content-[''] hover:text-primary focus-visible:outline-none"
                >
                  {job.title}
                </Link>
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {job.company.name || "Company not specified"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSaved(job.id)}
              className={cn(
                "relative z-10 shrink-0 rounded-full transition-colors",
                saved
                  ? "text-primary hover:bg-primary-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={
                saved
                  ? `Remove ${job.title} from saved jobs`
                  : `Save ${job.title}`
              }
              aria-pressed={saved}
            >
              <Bookmark
                className={cn(
                  "h-[1.15rem] w-[1.15rem]",
                  saved && "fill-current"
                )}
              />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCompensation(job.compensation, job.paid)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {now ? (job.deadline ? formatRelativeDate(job.deadline, now) : "Not specified") : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("border", JOB_TYPE_COLORS[job.type])}>
          {job.type}
        </Badge>
        {job.employmentType ? (
          <Badge className={cn("border", EMPLOYMENT_TYPE_COLORS[job.employmentType])}>
            {job.employmentType}
          </Badge>
        ) : null}
        <Badge
          variant={job.paid === undefined ? "secondary" : job.paid ? "success" : "warning"}
          className="border"
        >
          {job.paid === true ? "Paid" : job.paid === false ? "Unpaid" : "Not specified"}
        </Badge>
        {job.isDemo ? (
          <span className="demo-badge">Demo data</span>
        ) : (
          <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
            Verified {job.sourceType ?? "source"} listing
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 5 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            +{job.skills.length - 5}
          </span>
        )}
      </div>

      {typeof job.applicants === "number" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {job.applicants} demo applications
        </div>
      )}
    </article>
  );
}