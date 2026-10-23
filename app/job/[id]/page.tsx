import { Suspense } from "react";
import { DEMO_JOBS, type Job } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, IndianRupee, MapPin, Users, CheckCircle2, ExternalLink } from "lucide-react";
import { SavedJobsProvider } from "@/components/saved-jobs-provider";
import { JobDetailActions } from "@/components/job-detail-actions";
import { RelatedJobs } from "@/components/related-jobs";
import { fetchConfiguredInternships } from "@/lib/sources/sync";
import { decodeJobRouteId, normalizedSourceToJob } from "@/lib/data/jobs";

export async function generateStaticParams() {
  return DEMO_JOBS.map((job) => ({ id: job.id }));
}

function formatCompensationDisplay(job: Job): string {
  if (!job.paid || !job.compensation) return "Unpaid";
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.compensation.currency,
    maximumFractionDigits: 0,
  });
  const minStr = fmt.format(job.compensation.min);
  const maxStr = fmt.format(job.compensation.max);
  if (job.compensation.min === job.compensation.max) {
    return `${minStr}/${job.compensation.period}`;
  }
  return `${minStr} – ${maxStr}/${job.compensation.period}`;
}

async function JobDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routeId = decodeJobRouteId(id);
  let job = DEMO_JOBS.find((j) => j.id === routeId);
  if (!job) {
    try {
      const fetched = await fetchConfiguredInternships();
      const sourceJob = fetched.jobs.find((candidate) => candidate.sourceId === routeId);
      if (sourceJob) job = normalizedSourceToJob(sourceJob);
    } catch {
      // A live-source failure should not affect demo job details.
    }
  }
  if (!job) return notFound();

  return (
    <SavedJobsProvider>
      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            <li>
              <Link href="/#listings" className="hover:text-foreground transition-colors">Listings</Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            {job.role ? <li>
              <Link href={`/?role=${encodeURIComponent(job.role)}#listings`} className="hover:text-foreground transition-colors">{job.role}</Link>
            </li> : null}
            <li aria-hidden="true" className="text-border">/</li>
            <li className="truncate font-medium text-foreground" aria-current="page">{job.title}</li>
          </ol>
        </nav>

        <Link
          href="/#listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Hero banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-navy-soft via-navy to-card px-8 py-12 md:px-12 md:py-16">
            <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            <div className="relative z-10">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">{job.type}</Badge>
                <Badge className="border border-green-200 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">{job.employmentType}</Badge>
                <Badge variant={job.paid === undefined ? "secondary" : job.paid ? "success" : "warning"} className="border">
                  {job.paid === undefined ? "Not specified" : job.paid ? "Paid" : "Unpaid"}
                </Badge>
                {job.isDemo ? (
                  <span className="demo-badge">Demo data</span>
                ) : (
                  <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Verified {job.sourceType ?? "source"} listing
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{job.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{job.company.name}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Posted {new Date(job.posted).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                <span className="inline-flex items-center gap-1.5"><IndianRupee className="h-4 w-4" />{formatCompensationDisplay(job)}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="px-8 md:px-12 py-8 md:py-10 space-y-10">
            {/* Description */}
            <section aria-label="About this opportunity">
              <h2 className="text-xl font-bold text-foreground">About this opportunity</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{job.description}</p>
              {job.isDemo ? <div className="mt-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <strong>Important note:</strong> This listing is clearly labeled as <strong>demo data</strong> for development and preview purposes only. It does not represent a verified or real employment opportunity.
              </div> : null}
            </section>

            {/* Responsibilities */}
            <section aria-label="Responsibilities">
              <h2 className="text-xl font-bold text-foreground">What you will do</h2>
              <ul className="mt-4 space-y-3">
                {job.responsibilities.map((r) => (
                  <li key={r} className="flex gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" aria-hidden="true" /><span className="leading-relaxed">{r}</span></li>
                ))}
              </ul>
            </section>

            {/* Eligibility */}
            <section aria-label="Eligibility">
              <h2 className="text-xl font-bold text-foreground">Eligibility</h2>
              <ul className="mt-4 space-y-3">
                {job.eligibility.map((e) => (
                  <li key={e} className="flex gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" /><span className="leading-relaxed">{e}</span></li>
                ))}
              </ul>
            </section>

            {/* Skills */}
            <section aria-label="Required skills">
              <h2 className="text-xl font-bold text-foreground">Key skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md bg-primary-soft px-3 py-1 text-sm font-medium text-primary">{s}</span>
                ))}
              </div>
            </section>

            {/* Company */}
            <section aria-label="Company details" className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">{job.company.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{job.company.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{job.company.size}</span>
                <span>·</span>
                <span>{job.company.industry}</span>
                {job.company.website ? (
                  <>
                    <span>·</span>
                    <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Website <ExternalLink className="h-3 w-3" /></a>
                  </>
                ) : job.isDemo ? (
                  <>
                    <span>·</span>
                    <span className="italic">No real company website — this is a fictional demo company</span>
                  </>
                ) : null}
                {!job.isDemo && job.sourceUrl ? (
                  <>
                    <span>·</span>
                    <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      Official posting <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                ) : null}
              </div>
            </section>

            {/* Apply CTA */}
            <JobDetailActions
              jobId={job.id}
              jobTitle={job.title}
              hasApplicationLink={!!job.applicationLink}
              isDemo={job.isDemo}
              applicationLink={job.applicationLink}
            />

            {/* Related */}
            <section aria-label="Related opportunities">
              <h2 className="text-xl font-bold text-foreground mb-4">Related opportunities</h2>
              <RelatedJobs job={job} />
            </section>
          </div>
        </article>
      </main>
    </SavedJobsProvider>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">Loading job details...</div>}>
      <JobDetailContent params={params} />
    </Suspense>
  );
}
