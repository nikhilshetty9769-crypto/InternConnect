"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Ban, MailOpen, Trophy, Sparkles } from "lucide-react";
import { useTracker } from "@/components/application-tracker-provider";
import { resolveJobs } from "@/lib/data/jobs";
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from "@/lib/types";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_ICONS: Record<ApplicationStatus, React.ReactNode> = {
  interested: <MailOpen className="h-4 w-4" />,
  applied: <CheckCircle2 className="h-4 w-4" />,
  interview: <Clock className="h-4 w-4" />,
  offer: <Trophy className="h-4 w-4" />,
  rejected: <Ban className="h-4 w-4" />,
};

export function ApplicationTrackerClient() {
  const { tracked, updateStatus, remove, hydrated } = useTracker();

  const [resolved, setResolved] = React.useState<{ id: string; job: import("@/lib/types").Job | null }[]>([]);

  React.useEffect(() => {
    if (!hydrated) return;
    resolveJobs(tracked.map((t) => t.jobId)).then(setResolved);
  }, [tracked, hydrated]);

  const counts = React.useMemo(() => {
    const map: Record<ApplicationStatus, number> = {
      interested: 0, applied: 0, interview: 0, offer: 0, rejected: 0,
    };
    for (const t of tracked) map[t.status] = (map[t.status] || 0) + 1;
    return map;
  }, [tracked]);

  if (!hydrated) {
    return <div className="rounded-2xl border border-border bg-card p-8 animate-pulse-soft text-center text-sm text-muted-foreground">Loading applications...</div>;
  }

  if (tracked.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-10 text-center space-y-4">
        <ClipboardText />
        <h2 className="text-lg font-bold text-foreground">No tracked applications yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Track opportunities by visiting a job detail page and selecting your application status. Remember: this tracks your intent locally — it is not a submission to an employer.</p>
        <Link href="/#listings" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-xl hover:shadow-primary/30">
          <Sparkles className="h-4 w-4" /> Browse listings <span aria-hidden>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["interested", "applied", "interview", "offer", "rejected"] as ApplicationStatus[]).map((s) => (
          <div key={s} className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-foreground">{counts[s]}</div>
            <div className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[s]}`}>
              {STATUS_ICONS[s]} {APPLICATION_STATUS_LABELS[s]}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3">Opportunity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resolved.map(({ id, job }) => {
              const t = tracked.find((tr) => tr.jobId === id)!;
              return (
                <tr key={id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/job/${t.jobId}`} className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline">{job?.title ?? t.jobId}</Link>
                    <div className="text-xs text-muted-foreground">{job?.company.name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[t.status]}`}>
                      {STATUS_ICONS[t.status]} {APPLICATION_STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{t.appliedDate || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{t.notes || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.jobId, e.target.value as ApplicationStatus)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Update status"
                      >
                        {(["interested", "applied", "interview", "offer", "rejected"] as ApplicationStatus[]).map((s) => (
                          <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button onClick={() => remove(t.jobId)} className="rounded-md border border-input bg-background px-2 py-1 text-xs hover:text-danger transition-colors" aria-label="Remove tracking">Remove</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">These are locally tracked intentions — not submitted applications to employers. All listings are fictionally labeled demo data.</p>
    </div>
  );
}

function ClipboardText() {
  return (
    <svg className="mx-auto h-10 w-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
  );
}
