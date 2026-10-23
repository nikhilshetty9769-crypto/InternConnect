"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, BookmarkCheck, ClipboardList, Clock, Sparkles } from "lucide-react";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import { useProfile } from "@/components/profile-provider";
import { useTracker } from "@/components/application-tracker-provider";
import { DEMO_JOBS } from "@/lib/demo-data";
import { formatCompensation } from "@/lib/utils";

export const metadata = { title: "Dashboard — InternConnect" };

export function DashboardClient() {
  const { savedIds, hydrated: sHydrated } = useSavedJobs();
  const { profile, hydrated: pHydrated } = useProfile();
  const { tracked, hydrated: tHydrated } = useTracker();

  const recommended = React.useMemo(() => {
    const profileSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
    return DEMO_JOBS.filter((j) => !savedIds.includes(j.id) && !tracked.some((t) => t.jobId === j.id))
      .map((j) => {
        const score = j.skills.filter((s) => profileSkills.has(s.toLowerCase())).length + (profile.preferredRoles.includes(j.role) ? 2 : 0);
        return { j, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((r) => r.j);
  }, [profile, savedIds, tracked]);

  if (!sHydrated || !pHydrated || !tHydrated) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 animate-pulse-soft text-center text-sm text-muted-foreground">Loading dashboard data...</div>
      </main>
    );
  }

  const savedJobs = DEMO_JOBS.filter((j) => savedIds.includes(j.id));
  const savedCount = savedIds.length;
  const trackedCount = tracked.length;
  const upcoming = DEMO_JOBS.filter((j) => j.deadline && new Date(j.deadline) > new Date()).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()).slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Your internship discovery dashboard.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved opportunities" value={savedCount} icon={<BookmarkCheck className="h-5 w-5 text-primary" />} href="/saved" />
        <StatCard label="Tracked applications" value={trackedCount} icon={<ClipboardList className="h-5 w-5 text-primary" />} href="/applications" />
        <StatCard label="Upcoming deadlines" value={upcoming.length} icon={<Clock className="h-5 w-5 text-primary" />} />
        <StatCard label="Profile complete" value={`${profile.skills.length ? Math.round((profile.skills.length > 0 ? 60 : 20) + (profile.preferredRoles.length ? 20 : 0) + (profile.university ? 20 : 0)) : 0}%`} icon={<Sparkles className="h-5 w-5 text-primary" />} href="/profile" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Main column */}
        <div className="space-y-8">
          {/* Upcoming deadlines */}
          <section aria-label="Upcoming deadlines">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Upcoming deadlines</h2>
              <Link href="/" className="text-sm font-medium text-primary hover:underline">View all listings</Link>
            </div>
            <div className="depth-surface rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {upcoming.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No upcoming deadlines in demo data.</div>
              ) : (
                <div className="divide-y divide-border">
                  {upcoming.map((job) => (
                    <Link key={job.id} href={`/job/${job.id}`} className="block px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">{job.company.name} · {job.location}</p>
                        </div>
                        <span className="text-xs text-danger font-medium whitespace-nowrap">{job.deadline ? `Due ${new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No deadline"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Saved quick list */}
          <section aria-label="Saved opportunities">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Saved opportunities</h2>
              <Link href="/saved" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {savedJobs.slice(0, 4).map((job) => (
                <Link key={job.id} href={`/job/${job.id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                  <h3 className="font-semibold text-foreground text-sm">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">{job.company.name}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatCompensation(job.compensation, job.paid)}</span>
                    <span>·</span>
                    <span>Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not specified"}</span>
                  </div>
                </Link>
              ))}
              {savedJobs.length === 0 && (
                <div className="col-span-2 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  No saved jobs yet. <Link href="/#listings" className="text-primary hover:underline">Browse listings</Link> and click the bookmark icon.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section aria-label="Recommendations">
            <h2 className="text-lg font-extrabold tracking-tight text-foreground mb-3">Recommended for you</h2>
            <div className="space-y-3">
              {recommended.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete your profile to get personalized recommendations (rule-based on skills + preferences).</p>
              ) : (
                recommended.map((job) => (
                  <Link key={job.id} href={`/job/${job.id}`} className="block rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                    <h3 className="font-semibold text-sm text-foreground">{job.title}</h3>
                    <p className="text-xs text-muted-foreground">{job.company.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCompensation(job.compensation, job.paid)} · {job.employmentType}</p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section aria-label="Quick actions">
            <h2 className="text-lg font-extrabold tracking-tight text-foreground mb-3">Quick actions</h2>
            <div className="grid gap-2">
              <QuickLink href="/#listings" label="Browse listings" desc="Find internships and entry-level roles" icon={<ArrowRight className="h-4 w-4" />} />
              <QuickLink href="/saved" label="Saved jobs" desc={`${savedCount} saved opportunity`} icon={<BookmarkCheck className="h-4 w-4" />} />
              <QuickLink href="/applications" label="Track applications" desc={`${trackedCount} tracked`} icon={<ClipboardList className="h-4 w-4" />} />
              <QuickLink href="/profile" label="Edit profile" desc="Update skills and preferences" icon={<LayoutDashboard className="h-4 w-4" />} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, href }: { label: string; value: string | number; icon: React.ReactNode; href?: string }) {
  const body = (
    <div className="depth-surface depth-card rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary shadow-sm">{icon}</div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function QuickLink({ href, label, desc, icon }: { href: string; label: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="depth-surface depth-card flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
