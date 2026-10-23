/**
 * InternConnect — Core Domain Types
 *
 * Shared across the data layer, UI, and local persistence. These interfaces
 * double as the contract for a future database-backed implementation (see
 * `lib/data/`), so components never depend on hardcoded arrays directly.
 */

/** A single opportunity listing. */
export interface Job {
  id: string;
  sourceId?: string;
  sourceType?: "greenhouse" | "lever" | "ashby" | "manual";
  sourceUrl?: string;
  title: string;
  role: string; // canonical role from ROLES
  company: {
    name: string;
    logo?: string; // URL or emoji slug
    description: string;
    website?: string;
    size?: string;
    industry?: string;
  };
  location: string;
  remote: boolean;
  type: "Internship" | "Full-time" | "Part-time" | "Contract" | "Co-op";
  /**
   * Work model. Optional because some sources do not provide it — never
   * fabricate a work model for a real posting.
   */
  /**
   * Work model. Optional — many career boards do not publish one.
   * `undefined` means "not stated by the source", never a guess.
   */
  employmentType?: "Remote" | "On-site" | "Hybrid";
  /**
   * Whether the role is paid. Optional — `undefined` means the source did
   * not say. It must NOT be treated as "unpaid".
   */
  paid?: boolean;
  compensation?: {
    min: number;
    max: number;
    currency: string;
    period: "hour" | "month" | "year" | "project";
  };
  posted: string;
  /**
   * Application deadline. Optional — most career boards do not publish one.
   * `undefined` means "not stated by the source", never a guess.
   */
  deadline?: string;
  /**
   * True for the fictional demo listings, false for real source postings.
   * Never relabel a real posting as demo data.
   */
  isDemo: boolean;
  responsibilities: string[];
  eligibility: string[];
  skills: string[];
  description: string;
  /** Empty when no real application page exists. */
  applicationLink: string;
  applicants?: number;
}

/** Application status for a locally tracked application. */
export type ApplicationStatus =
  | "interested"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  interested: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  applied: "bg-primary-soft text-primary border-primary/20",
  interview: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  offer: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
};

/** A locally tracked application. Never represents a real submission. */
export interface TrackedApplication {
  jobId: string;
  status: ApplicationStatus;
  /** ISO date (YYYY-MM-DD) the student locally recorded applying. */
  appliedDate?: string;
  notes?: string;
  updatedAt: string;
}

/** Student profile. Entirely local to this browser in the current phase. */
export interface StudentProfile {
  name: string;
  headline: string;
  university: string;
  degree: string;
  graduationYear: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  preferredWorkModes: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export const EMPTY_PROFILE: StudentProfile = {
  name: "",
  headline: "",
  university: "",
  degree: "",
  graduationYear: "",
  skills: [],
  preferredRoles: [],
  preferredLocations: [],
  preferredWorkModes: [],
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
};

/** How a job was matched to a profile — surfaced so the logic is transparent. */
export interface RecommendationReason {
  label: string;
  kind: "skill" | "role" | "location" | "workMode";
}

export interface RecommendedJob {
  jobId: string;
  /** 0–100. Rule-based match score, not a machine-learning prediction. */
  score: number;
  reasons: RecommendationReason[];
}

/** A job the student opened recently. Local only, capped in storage. */
export interface RecentView {
  jobId: string;
  viewedAt: string;
}

/** Sort options for the listings page. */
export type SortOption = "newest" | "deadline" | "compensation" | "relevance";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "deadline", label: "Deadline (soonest)" },
  { value: "compensation", label: "Compensation (highest)" },
  { value: "relevance", label: "Relevance" },
];

/** Filter state for the listings page. */
export type JobFilters = {
  query: string;
  role: string;
  location: string;
  remote: string;
  type: string;
  paid: string;
  skill: string;
  sort: SortOption;
};

export const DEFAULT_FILTERS: JobFilters = {
  query: "",
  role: "all",
  location: "all",
  remote: "all",
  type: "all",
  paid: "all",
  skill: "all",
  sort: "newest",
};
