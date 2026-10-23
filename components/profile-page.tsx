"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "@/components/profile-provider";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import { DEMO_JOBS, ROLES, LOCATIONS, SKILLS, EMPLOYMENT_TYPES } from "@/lib/demo-data";
import { type StudentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, Save, Pencil, Code, Globe } from "lucide-react";

const emptyForm: StudentProfile = {
  name: "", headline: "", university: "", degree: "", graduationYear: "",
  skills: [], preferredRoles: [], preferredLocations: [], preferredWorkModes: [],
  portfolioUrl: "", githubUrl: "", linkedinUrl: "",
};

/** Validates that a URL is a well-formed absolute http(s) URL. */
function isValidUrl(value: string | undefined): boolean {
  if (!value || !value.trim()) return true; // optional field
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function ProfileClient() {
  const { profile, save, hydrated } = useProfile();
  const { savedIds } = useSavedJobs();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<StudentProfile>(emptyForm);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (hydrated) queueMicrotask(() => setForm(profile));
  }, [hydrated, profile]);

  const update = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleInArray = (key: "skills" | "preferredRoles" | "preferredLocations" | "preferredWorkModes", value: string) => {
    setForm((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
    setSaved(false);
  };

  const urlErrors = {
    portfolioUrl: !isValidUrl(form.portfolioUrl),
    githubUrl: !isValidUrl(form.githubUrl),
    linkedinUrl: !isValidUrl(form.linkedinUrl),
  };
  const hasUrlError = Object.values(urlErrors).some(Boolean);

  const completion = React.useMemo(() => {
    const checks = [
      form.name.trim().length > 0,
      form.headline.trim().length > 0,
      form.university.trim().length > 0,
      form.degree.trim().length > 0,
      form.graduationYear.trim().length > 0,
      form.skills.length > 0,
      form.preferredRoles.length > 0,
      form.preferredLocations.length > 0,
      form.preferredWorkModes.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [form]);

  // Rule-based recommendations: transparent matching on skills + preferences.
  const recommendations = React.useMemo(() => {
    if (!form.skills.length && !form.preferredRoles.length) return [];
    const profileSkills = new Set(form.skills.map((s) => s.toLowerCase()));

    return DEMO_JOBS.map((job) => {
      const reasons: string[] = [];
      let score = 0;
      const sharedSkills = job.skills.filter((s) => profileSkills.has(s.toLowerCase()));
      if (sharedSkills.length) {
        score += sharedSkills.length * 2;
        reasons.push(`Matches your skills: ${sharedSkills.slice(0, 3).join(", ")}`);
      }
      if (form.preferredRoles.includes(job.role)) {
        score += 4;
        reasons.push(`Matches preferred role: ${job.role}`);
      }
      if (form.preferredLocations.includes(job.location)) {
        score += 2;
        reasons.push(`Matches preferred location: ${job.location}`);
      }
      if (form.preferredWorkModes.includes(job.employmentType ?? "")) {
        score += 2;
        reasons.push(`Matches work mode: ${job.employmentType}`);
      }
      return { job, score, reasons };
    })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [form]);

  if (!hydrated) {
    return <div className="rounded-2xl border border-border bg-card p-8 animate-pulse-soft text-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Profile form */}
      <section aria-label="Profile details" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground">Details</h2>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setForm(profile); setEditing(false); setSaved(false); }}>Cancel</Button>
              <Button size="sm" disabled={hasUrlError} onClick={() => { save(form); setEditing(false); setSaved(true); }}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>

        {saved && !editing && (
          <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
            Profile saved locally in this browser.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
            <Input id="p-name" value={form.name} disabled={!editing} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-headline" className="mb-1.5 block text-sm font-medium text-foreground">Short introduction</label>
            <Input id="p-headline" value={form.headline} disabled={!editing} onChange={(e) => update("headline", e.target.value)} placeholder="e.g. CS student passionate about frontend engineering" />
          </div>
          <div>
            <label htmlFor="p-university" className="mb-1.5 block text-sm font-medium text-foreground">University / college</label>
            <Input id="p-university" value={form.university} disabled={!editing} onChange={(e) => update("university", e.target.value)} placeholder="Your university" />
          </div>
          <div>
            <label htmlFor="p-degree" className="mb-1.5 block text-sm font-medium text-foreground">Degree</label>
            <Input id="p-degree" value={form.degree} disabled={!editing} onChange={(e) => update("degree", e.target.value)} placeholder="e.g. B.Tech Computer Science" />
          </div>
          <div>
            <label htmlFor="p-year" className="mb-1.5 block text-sm font-medium text-foreground">Graduation year</label>
            <Input id="p-year" value={form.graduationYear} disabled={!editing} onChange={(e) => update("graduationYear", e.target.value)} placeholder="e.g. 2027" />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => {
              const active = form.skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!editing}
                  onClick={() => toggleInArray("skills", s)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/20"
                  } ${!editing ? "cursor-default opacity-80" : ""}`}
                  aria-pressed={active}
                >
                  {active && <Check className="mr-1 inline h-3 w-3" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred roles */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Preferred roles</h3>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const active = form.preferredRoles.includes(r);
              return (
                <button key={r} type="button" disabled={!editing} onClick={() => toggleInArray("preferredRoles", r)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/20"} ${!editing ? "cursor-default opacity-80" : ""}`}
                  aria-pressed={active}>
                  {active && <Check className="mr-1 inline h-3 w-3" />}{r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred locations */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Preferred locations</h3>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map((l) => {
              const active = form.preferredLocations.includes(l);
              return (
                <button key={l} type="button" disabled={!editing} onClick={() => toggleInArray("preferredLocations", l)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/20"} ${!editing ? "cursor-default opacity-80" : ""}`}
                  aria-pressed={active}>
                  {active && <Check className="mr-1 inline h-3 w-3" />}{l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred work modes */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Preferred work modes</h3>
          <div className="flex flex-wrap gap-1.5">
            {EMPLOYMENT_TYPES.map((w) => {
              const active = form.preferredWorkModes.includes(w);
              return (
                <button key={w} type="button" disabled={!editing} onClick={() => toggleInArray("preferredWorkModes", w)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/20"} ${!editing ? "cursor-default opacity-80" : ""}`}
                  aria-pressed={active}>
                  {active && <Check className="mr-1 inline h-3 w-3" />}{w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="p-portfolio" className="mb-1.5 block text-sm font-medium text-foreground">Portfolio URL</label>
            <Input id="p-portfolio" value={form.portfolioUrl} disabled={!editing} onChange={(e) => update("portfolioUrl", e.target.value)} placeholder="https://…" aria-invalid={urlErrors.portfolioUrl} />
            {urlErrors.portfolioUrl && <p className="mt-1 text-xs text-danger">Enter a valid http(s) URL.</p>}
          </div>
          <div>
            <label htmlFor="p-github" className="mb-1.5 block text-sm font-medium text-foreground">GitHub URL</label>
            <Input id="p-github" value={form.githubUrl} disabled={!editing} onChange={(e) => update("githubUrl", e.target.value)} placeholder="https://github.com/…" aria-invalid={urlErrors.githubUrl} />
            {urlErrors.githubUrl && <p className="mt-1 text-xs text-danger">Enter a valid http(s) URL.</p>}
          </div>
          <div>
            <label htmlFor="p-linkedin" className="mb-1.5 block text-sm font-medium text-foreground">LinkedIn URL</label>
            <Input id="p-linkedin" value={form.linkedinUrl} disabled={!editing} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/…" aria-invalid={urlErrors.linkedinUrl} />
            {urlErrors.linkedinUrl && <p className="mt-1 text-xs text-danger">Enter a valid http(s) URL.</p>}
          </div>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Profile completion</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{completion}% complete — add skills and preferences to get better matches.</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Recommended for you
          </h2>
          {recommendations.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Add your skills and preferred roles to see recommendations. Matching is rule-based on skills and preferences.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recommendations.map(({ job, reasons }) => (
                <li key={job.id} className="rounded-lg border border-border p-3">
                  <Link href={`/job/${job.id}`} className="text-sm font-semibold text-foreground hover:text-primary">{job.title}</Link>
                  <p className="text-xs text-muted-foreground">{job.company.name}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {reasons.slice(0, 2).map((r) => (
                      <li key={r} className="text-xs text-primary/80">• {r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Rule-based matching on your skills and preferences — not an AI prediction.</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Your links</h2>
          <div className="mt-3 space-y-2">
            {[
              { url: form.portfolioUrl, label: "Portfolio", icon: <Globe className="h-3.5 w-3.5" /> },
              { url: form.githubUrl, label: "GitHub", icon: <Code className="h-3.5 w-3.5" /> },
              { url: form.linkedinUrl, label: "LinkedIn", icon: <Globe className="h-3.5 w-3.5" /> },
            ].map((l) => (
              l.url && isValidUrl(l.url) ? (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  {l.icon} {l.label}
                </a>
              ) : null
            ))}
            {!form.portfolioUrl && !form.githubUrl && !form.linkedinUrl && (
              <p className="text-xs text-muted-foreground">No links added yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Saved opportunities</h2>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{savedIds.length}</p>
          <Link href="/saved" className="mt-2 inline-block text-sm text-primary hover:underline">View saved jobs</Link>
        </section>
      </aside>
    </div>
  );
}
