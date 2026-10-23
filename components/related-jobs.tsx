"use client";

import Link from "next/link";
import { DEMO_JOBS } from "@/lib/demo-data";
import type { Job } from "@/lib/types";

export function RelatedJobs({ job }: { job: Job }) {
  const jobSkills = new Set(job.skills);
  const related = DEMO_JOBS.filter((c) => c.id !== job.id)
    .map((c) => ({
      c,
      score: c.skills.filter((s) => jobSkills.has(s)).length + (c.role === job.role ? 3 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.c);

  if (related.length === 0) {
    return <p className="text-sm text-muted-foreground">No closely related opportunities in demo data.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {related.map((j) => (
        <Link
          key={j.id}
          href={`/job/${j.id}`}
          className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
        >
          <h3 className="font-semibold text-sm text-foreground">{j.title}</h3>
          <p className="text-xs text-muted-foreground">{j.company.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex rounded-full bg-secondary px-2 py-0.5">{j.type}</span>
            <span className="inline-flex rounded-full bg-primary-soft text-primary px-2 py-0.5">{j.employmentType}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
