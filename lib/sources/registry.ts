/**
 * Curated source research.
 *
 * Entries are evidence records, not a job fixture. A source is fetched only
 * when its identifier is explicitly configured in the environment.
 */

export type CuratedSourceStatus = "verified" | "not-confirmed";

export interface CuratedSource {
  company: string;
  provider: "greenhouse" | "lever" | "ashby";
  identifier: string;
  endpoint: string;
  officialBoardUrl: string | null;
  status: CuratedSourceStatus;
  publishedPostingsAtResearch: number;
  internshipMatchesAtResearch: number;
  indiaEligibleAtResearch: number;
  notes?: string;
}

const greenhouseEndpoint = (identifier: string) =>
  `https://boards-api.greenhouse.io/v1/boards/${identifier}/jobs?content=true`;

const confirmedGreenhouse = (
  company: string,
  identifier: string,
  publishedPostingsAtResearch: number,
  internshipMatchesAtResearch: number,
  indiaEligibleAtResearch: number
): CuratedSource => ({
  company,
  provider: "greenhouse",
  identifier,
  endpoint: greenhouseEndpoint(identifier),
  officialBoardUrl: `https://job-boards.greenhouse.io/${identifier}`,
  status: "verified",
  publishedPostingsAtResearch,
  internshipMatchesAtResearch,
  indiaEligibleAtResearch,
});

const unconfirmedGreenhouse = (company: string, identifier: string): CuratedSource => ({
  company,
  provider: "greenhouse",
  identifier,
  endpoint: greenhouseEndpoint(identifier),
  officialBoardUrl: null,
  status: "not-confirmed",
  publishedPostingsAtResearch: 0,
  internshipMatchesAtResearch: 0,
  indiaEligibleAtResearch: 0,
  notes: "The official Greenhouse endpoint returned 404 during research; not enabled.",
});

/**
 * Research snapshot for 20 technology-company candidates. Counts are
 * observations from the official endpoint at research time, not guarantees.
 */
export const CURATED_SOURCE_REGISTRY: readonly CuratedSource[] = [
  confirmedGreenhouse("Enterpret", "enterpret", 15, 1, 1),
  confirmedGreenhouse("HackerRank", "hackerrank", 30, 1, 1),
  confirmedGreenhouse("Stripe", "stripe", 730, 35, 3),
  confirmedGreenhouse("Datadog", "datadog", 438, 9, 0),
  confirmedGreenhouse("Cloudflare", "cloudflare", 443, 5, 0),
  confirmedGreenhouse("GitLab", "gitlab", 232, 1, 0),
  confirmedGreenhouse("Figma", "figma", 139, 8, 0),
  confirmedGreenhouse("Coinbase", "coinbase", 228, 33, 0),
  confirmedGreenhouse("Ramp", "ramp", 1, 0, 0),
  confirmedGreenhouse("Brex", "brex", 265, 0, 0),
  confirmedGreenhouse("Okta", "okta", 396, 0, 0),
  confirmedGreenhouse("Samsara", "samsara", 267, 7, 0),
  confirmedGreenhouse("Twilio", "twilio", 131, 3, 0),
  confirmedGreenhouse("Pinterest", "pinterest", 163, 13, 0),
  confirmedGreenhouse("Reddit", "reddit", 156, 2, 0),
  confirmedGreenhouse("Discord", "discord", 44, 0, 0),
  confirmedGreenhouse("Asana", "asana", 105, 0, 0),
  confirmedGreenhouse("Groww", "groww", 10, 1, 1),
  confirmedGreenhouse("InMobi", "inmobi", 80, 0, 0),
  confirmedGreenhouse("Slice", "slice", 23, 0, 0),
  confirmedGreenhouse("Porter", "porter", 5, 0, 0),
  confirmedGreenhouse("Turing", "turing", 30, 0, 0),
  confirmedGreenhouse("HighRadius", "highradius", 69, 0, 0),
  confirmedGreenhouse("Observe.AI", "observeai", 9, 0, 0),
  confirmedGreenhouse("Rubrik", "rubrik", 145, 1, 2),
  confirmedGreenhouse("BigID", "bigid", 8, 0, 0),
  confirmedGreenhouse("Druva", "druva", 32, 0, 0),
  confirmedGreenhouse("LogicMonitor", "logicmonitor", 52, 0, 0),
  unconfirmedGreenhouse("Uber", "uber"),
  unconfirmedGreenhouse("Notion", "notion"),
  unconfirmedGreenhouse("Canva", "canva"),
];

export function findCuratedSource(
  provider: CuratedSource["provider"],
  identifier: string
): CuratedSource | undefined {
  return CURATED_SOURCE_REGISTRY.find(
    (source) => source.provider === provider && source.identifier === identifier
  );
}
