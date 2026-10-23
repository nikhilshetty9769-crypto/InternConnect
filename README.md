# InternConnect

A polished, production-quality student job & internship discovery platform.

## What it does
- Discover internships, fresher jobs, and entry-level opportunities.
- Search and filter by role, skills, location, work model, employment type, pay, and keyword.
- Save/unbookmark job listings and view them separately.
- Track locally where you are in the process (Interested → Applied → Interview → Offer → Rejected).
- Edit a profile with skills, preferred roles/locations/work modes, and display simple rule-based recommendations.
- View a dashboard with quick stats, saved jobs, tracked applications, upcoming deadlines, and recommendations.

## Demo data
All companies and job listings are fictional and clearly labeled as **Demo data**. No real employers, verified jobs, real application URLs, or salaries are included. The interface is designed for development practice.

## Browser requirements
- Modern browser with ES2024 support (Node.js 18+, Next.js 16.4.2)
- Local storage available (for saved jobs and profile)

## Running the app
```bash
npm run dev
```
Open http://localhost:3000 (dev server).

## Notes
- Filtered job listing respects a `?role=` query parameter supplied by category links and job-detail breadcrumbs.
- `useSearchParams()` is wrapped in `<Suspense>` in the `RoleFilterSync` component to avoid the Next.js URL-data-outside-Suspense warning.
- 3D‑style wordmark uses CSS gradients, shadows, and subtle animation (disabled when `prefers-reduced-motion` is set).
- Mobile navigation is available via a hamburger menu on screens narrower than `md`.
- Theme toggle switches between dark and light with localStorage persistence.

## Verified source policy
- Greenhouse, Lever, and Ashby are read only through their public job-board APIs.
- Internship listings are filtered to India locations or source-provided locations that
  explicitly identify India. A generic `Remote` label is not treated as India eligibility.
- Salesforce careers is not integrated because its official careers site does not publish
  a documented public jobs API contract that this project can consume without scraping.
- A source is not presented as live until its configured official endpoint has been tested.
- The curated source research snapshot is in `lib/sources/registry.ts`. Only identifiers
  explicitly configured in environment variables are fetched; registry entries do not
  fabricate jobs or automatically enable every candidate.
- Source health distinguishes fetch failures, invalid responses, empty boards, boards with
  no internship matches, boards with no India-eligible internships, and eligible results.
- Vercel deployments can run `/api/internal/sync-scheduled` every 12 hours using the
  checked-in `vercel.json` cron declaration. Configure `CRON_SECRET` in the deployment
  environment; other schedulers may use `SYNC_SECRET` and the `x-sync-secret` header.
- In production, the scheduled route requires `CRON_SECRET`; local testing can use either
  secret. The route rejects a concurrent request within the same function instance with
  HTTP 409. Vercel may invoke separate instances concurrently, so strict cross-instance
  locking requires durable coordination and is intentionally not claimed here.
- The configured sources are fetched sequentially with bounded connector timeouts and one
  retry. The route declares a 120-second maximum duration; the Vercel plan must permit
  that duration, or the source list/timeouts must be reduced.
- The current repository is in-memory, so scheduled refresh state and closed records are
  process-local. This includes source jobs, `firstSeenAt`, `syncCount`, closed statuses,
  per-source last-successful refresh timestamps, and the same-instance overlap guard.
  A durable Recently Added history, cross-instance lock, and refresh state across cold
  starts require a persistent store, which is intentionally out of scope for this phase.

## Files
- `app/` — Next.js routes; all pages are client‑rendered for interactivity.
- `components/` — UI components, providers, and utilities.
- `lib/` — Domain models (`types.ts`), utilities, and a thin repository interface for future database swapping.
- `components/brand-logo.tsx` — The logo in navbar and hero.

## Future improvements (when needed)
- Connect a real database (MongoDB) and add authentication.
- Implement actual job applications (external forms).
- Enhance the recommendation engine with AI‑style predictions.
- Add job‑seeker profile completion scores, sharing, and export.
- Expand social proof, testimonials, and company logos for demo data.

## Quality
- All existing demo data placeholder URLs have been cleared (`lib/demo-data.ts`).
- Build (`npm run build`) passes TypeScript and Next.js static optimization checks.
- React and Next.js 16-specific best practices (Suspense for URL data, partial prefetching, cache components).
- Accessible HTML semantics and visible focus states.
- Responsive design for mobile, tablet, and desktop.
- Free of lint errors (standard ESLint rules).