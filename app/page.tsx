import { DEMO_JOBS } from "@/lib/demo-data";
import { normalizedSourceToJob } from "@/lib/data/jobs";
import { fetchConfiguredInternships } from "@/lib/sources/sync";
import HomePage from "@/components/home-page";
import type { Job } from "@/lib/types";

export default async function Home() {
  let liveJobs: Job[] = [];
  let liveSourceError = false;

  try {
    const fetched = await fetchConfiguredInternships();
    liveJobs = fetched.jobs.map(normalizedSourceToJob);
    liveSourceError = fetched.errors.length > 0;
  } catch {
    liveSourceError = true;
  }

  return (
    <HomePage
      jobs={[...DEMO_JOBS, ...liveJobs]}
      liveSourceError={liveSourceError}
    />
  );
}
