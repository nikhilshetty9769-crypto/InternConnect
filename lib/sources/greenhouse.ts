/**
 * Greenhouse connector — Phase 2 / revised for the v1 boards API
 *
 * Reads board identifier from GREENHOUSE_BOARD_TOKEN.
 * Never fabricates a board token. Does not claim connection until tested.
 *
 * Endpoint (official Greenhouse Job Board API):
 *   GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 *
 * Documentation reference: https://docs.greenhouse.io/job-board
 */

export interface GreenhousePost {
  id: number;
  title: string;
  company_name?: string;
  absolute_url?: string;
  location?: { name?: string } | string;
  updated_at?: string;
  first_published?: string;
  created_at?: string;
  content?: string;
  departments?: Array<{ name?: string; id?: number }>;
  offices?: Array<{ name?: string; location?: string; id?: number }>;
  employment_type?: string; // frequently absent on the public endpoint
}

export interface GreenhouseNormalized {
  sourceType: "greenhouse";
  sourceId: string; // board_token + job_id for stability
  boardToken: string;
  title: string;
  companyName: string | null; // null when the source does not provide it
  location: string | null;
  description: string | null;
  applicationUrl: string | null;
  publicationDate: string | null; // first_published, else updated_at
  lastVerifiedAt: string;
  status: "published" | "missing" | "error";
  missingFields: string[];
  raw: Record<string, unknown>;
}

export function getGreenhouseBoardToken(): string | null {
  const t = process.env.GREENHOUSE_BOARD_TOKEN;
  if (!t || t.trim() === "" || t === "REPLACE_ME") return null;
  return t.trim();
}

function timeoutMs(duration = 8000): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), duration)
  );
}

/* -------------------------------------------------------------------------- */
/* Internship detection                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Titles that contain one of these words are NOT internships, even if the
 * title also mentions an internship term. Guards against roles like
 * "Software Engineering Intern" being listed as a full-time role, and
 * against "Summer Internship Program Manager" style false positives.
 */
const NON_INTERNSHIP_TITLE_SIGNALS = [
  "internship program manager",
  "intern program manager",
  "internship coordinator",
  "internship recruiter",
];

/** Words that mark a posting as an internship / co-op / traineeship. */
const INTERNSHIP_TITLE_SIGNALS = [
  "intern",
  "internship",
  "trainee",
  "traineeship",
  "co-op",
  "coop",
  "apprentice",
  "apprenticeship",
  "placement student",
  "working student",
  "praktikum",
  "practical training",
  "new grad", // commonly used for student-eligible entry roles
];

function containsTitleSignal(title: string, signal: string): boolean {
  return new RegExp(
    `(?:^|[^a-z0-9])${signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`,
    "i"
  ).test(title);
}

/**
 * Decides whether a Greenhouse posting is an internship / student role.
 *
 * Rules (deterministic, explainable):
 *  1. The title must contain an internship signal word.
 *  2. The title must NOT contain a known non-internship signal.
 *  3. If the source provides `employment_type`, it must look like an
 *     internship-type contract.
 *
 * Ordinary full-time roles ("Account Executive", "Principal Engineer",
 * "Business Development Representative") do NOT match any signal and are
 * therefore excluded.
 */
export function isInternshipPosting(post: {
  title?: string;
  employment_type?: string;
  departments?: Array<{ name?: string }>;
}): boolean {
  const title = (post.title ?? "").toLowerCase().trim();
  if (!title) return false;

  // Rule 2 first: explicit disqualifiers.
  if (NON_INTERNSHIP_TITLE_SIGNALS.some((s) => containsTitleSignal(title, s))) {
    return false;
  }

  // Rule 3: if employment type is present and is clearly a full-time
  // contract, the posting is not an internship.
  const employmentType = (post.employment_type ?? "").toLowerCase();
  if (
    employmentType &&
    !INTERNSHIP_TITLE_SIGNALS.some((s) => containsTitleSignal(employmentType, s)) &&
    (employmentType.includes("full time") ||
      employmentType.includes("full-time") ||
      employmentType.includes("permanent") ||
      employmentType.includes("regular"))
  ) {
    return false;
  }

  // Rule 1: title signal.
  return INTERNSHIP_TITLE_SIGNALS.some((s) => containsTitleSignal(title, s));
}

/**
 * Extracts a clean, readable description from Greenhouse's HTML content.
 * Preserves paragraph breaks, bullet points, and basic structure.
 * The public endpoint returns HTML; we convert to readable plain text safely.
 *
 * Rules:
 *   - <br>, <p>, <div>, </div> become newlines
 *   - <li> items are prefixed with "• "
 *   - <h1>–<h6> tags are preserved as bold-like text
 *   - All other HTML tags are removed
 *   - HTML entities are decoded
 *   - Multiple consecutive newlines are collapsed to max 2
 */
export function stripHtml(html: string | undefined | null): string | null {
  if (!html) return null;

  const text = decodeHtmlEntities(html)
    // Remove executable or non-visible element contents before stripping tags.
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Preserve heading structure
    .replace(/<h[1-6][^>]*>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    // Convert <br> and closing block tags to newlines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|section|article)>/gi, "\n")
    // Opening block tags become newlines
    .replace(/<(p|div|blockquote|section|article)[^>]*>/gi, "\n")
    // List items get a bullet
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/?u?l[^>]*>/gi, "\n")
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, " ")
    // Collapse multiple spaces
    .replace(/[ \t]+/g, " ")
    // Collapse multiple newlines (allow max 2 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    // Remove leading/trailing whitespace
    .trim();

  return text.length > 0 ? text : null;
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    bull: "•",
    copy: "©",
    hellip: "…",
    gt: ">",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    ldquo: "“",
    lsquo: "‘",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
    trade: "™",
  };

  return value.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z][a-z0-9]+));/gi,
    (entity, decimal, hexadecimal, name: string) => {
      if (decimal) {
        const codePoint = Number.parseInt(decimal, 10);
        return Number.isInteger(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
      if (hexadecimal) {
        const codePoint = Number.parseInt(hexadecimal, 16);
        return Number.isInteger(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
      return namedEntities[name.toLowerCase()] ?? entity;
    }
  );
}

/**
 * Resolves the location string from the Greenhouse payload.
 * `location` may be an object with `name` or a plain string.
 * Falls back to offices array when top-level location is absent.
 * Handles remote/hybrid indicators gracefully.
 */
export function resolveLocation(post: GreenhousePost): string | null {
  // Try top-level location field first
  const loc = post.location;
  if (typeof loc === "string" && loc.trim()) {
    return loc.trim();
  }
  if (loc && typeof loc === "object" && typeof loc.name === "string" && loc.name.trim()) {
    return loc.name.trim();
  }

  // Fall back to offices array
  const office = post.offices?.[0];
  if (office?.location && office.location.trim()) {
    return office.location.trim();
  }
  if (office?.name && office.name.trim()) {
    return office.name.trim();
  }

  // Check for multiple offices (indicates multi-location)
  if (post.offices && post.offices.length > 1) {
    const validOffices = post.offices
      .map(o => o.name || o.location)
      .filter((loc): loc is string => Boolean(loc && loc.trim()));
    if (validOffices.length > 1) {
      return `${validOffices[0]} +${validOffices.length - 1} more`;
    }
  }

  return null;
}

/**
 * Normalizes one Greenhouse posting into the shared shape.
 * Missing fields are recorded — never fabricated.
 */
export function normalizeGreenhousePost(
  post: GreenhousePost,
  boardToken: string
): GreenhouseNormalized {
  const missingFields: string[] = [];

  const title = post.title?.trim() ?? "";
  if (!title) missingFields.push("title");

  const companyName = post.company_name?.trim() || null;
  if (!companyName) missingFields.push("company.name");

  const location = resolveLocation(post);
  if (!location) missingFields.push("location");

  const applicationUrl = post.absolute_url?.trim() || null;
  if (!applicationUrl) missingFields.push("applicationUrl");

  const description = stripHtml(post.content);
  if (!description) missingFields.push("description");

  const publicationDate = post.first_published ?? post.created_at ?? post.updated_at ?? null;
  if (!publicationDate) missingFields.push("publicationDate");

  return {
    sourceType: "greenhouse",
    sourceId: `gh:${boardToken}:${post.id}`,
    boardToken,
    title: title || "Untitled",
    companyName,
    location,
    description,
    applicationUrl,
    publicationDate,
    lastVerifiedAt: new Date().toISOString(),
    status: "published",
    missingFields,
    raw: post as unknown as Record<string, unknown>,
  };
}

/**
 * Fetches published postings for a Greenhouse board.
 *
 * Returns normalized records plus per-call errors. A failed call never
 * returns a partially fabricated list — it returns an empty list with the
 * error recorded.
 */
export async function fetchGreenhouseJobs(
  boardToken: string,
  opts?: { timeout?: number; retries?: number }
): Promise<{ jobs: GreenhouseNormalized[]; errors: string[]; summary: string }> {
  const errors: string[] = [];
  const jobs: GreenhouseNormalized[] = [];
  const timeout = opts?.timeout ?? 8000;
  const maxRetries = opts?.retries ?? 1;

  // No fabricated board. Fail clearly if missing.
  if (!boardToken || boardToken.trim() === "") {
    errors.push("GREENHOUSE_BOARD_TOKEN is empty or missing.");
    return { jobs, errors, summary: "No board configured." };
  }

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    boardToken
  )}/jobs?content=true`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await Promise.race([
        fetch(url, { next: { revalidate: 3600 } }),
        timeoutMs(timeout),
      ]);

      if (!res.ok) {
        const msg = `Greenhouse HTTP ${res.status} for board ${boardToken}`;
        if (attempt === maxRetries) {
          errors.push(msg);
          break;
        }
        continue; // retry
      }

      const data = (await res.json()) as { jobs?: GreenhousePost[] };
      const postings = Array.isArray(data.jobs) ? data.jobs : [];

      for (const post of postings) {
        jobs.push(normalizeGreenhousePost(post, boardToken));
      }

      return {
        jobs,
        errors,
        summary: `Greenhouse board ${boardToken}: ${jobs.length} published postings fetched, ${errors.length} errors.`,
      };
    } catch (e: unknown) {
      const msg = `Greenhouse fetch error: ${e instanceof Error ? e.message : String(e)}`;
      if (attempt === maxRetries) errors.push(msg);
    }
  }

  return {
    jobs,
    errors,
    summary: `Greenhouse board ${boardToken}: failed after ${maxRetries + 1} attempts. ${errors.length} errors.`,
  };
}

/**
 * Convenience: fetch a board and return ONLY internship postings.
 * Non-internship roles are filtered out, never relabelled.
 */
export async function fetchGreenhouseInternships(
  boardToken: string,
  opts?: { timeout?: number; retries?: number }
): Promise<{
  jobs: GreenhouseNormalized[];
  internships: GreenhouseNormalized[];
  errors: string[];
  summary: string;
}> {
  const result = await fetchGreenhouseJobs(boardToken, opts);
  const internships = result.jobs.filter((job) =>
    isInternshipPosting({
      title: job.title,
      employment_type: job.raw?.employment_type as string | undefined,
      departments: job.raw?.departments as Array<{ name?: string }> | undefined,
    })
  );

  return {
    ...result,
    internships,
    summary: `Greenhouse board ${boardToken}: ${internships.length} internships out of ${result.jobs.length} postings.`,
  };
}
