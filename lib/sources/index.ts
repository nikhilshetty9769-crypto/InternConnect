/**
 * InternConnect — Source connectors index (Phase 6)
 *
 * Aggregates jobs from all configured sources into the shared NormalizedJob
 * shape. Used by the "Latest Opportunities" page and the sync service.
 */

import type { NormalizedJob } from "@/lib/sources/types";
import { sourceJobRepository } from "@/lib/sources/repository";

export type {
  NormalizedJob,
  SourceHealth,
  SourceHealthStatus,
  SourceResult,
  SyncRun,
} from "@/lib/sources/types";
export { loadSources, runSync, missingConfig } from "@/lib/sources/sync";
export {
  CURATED_SOURCE_REGISTRY,
  findCuratedSource,
} from "@/lib/sources/registry";
export { getGreenhouseBoardToken } from "@/lib/sources/greenhouse";
export { getLeverCompanyId } from "@/lib/sources/lever";
export { getAshbyBoardName } from "@/lib/sources/ashby";
export { sourceJobRepository, memorySourceJobRepository } from "@/lib/sources/repository";

/**
 * Convenience: list all stored real-source jobs as NormalizedJob[] for UI use.
 */
export async function listAllVerifiedJobs(): Promise<NormalizedJob[]> {
  const stored = await sourceJobRepository.list({ limit: 100 });
  return stored.map((j) => ({
    sourceType: j.sourceType,
    sourceId: j.sourceId,
    boardToken: j.boardToken,
    title: j.title,
    companyName: j.companyName,
    location: j.location,
    description: j.description,
    sourceUrl: j.sourceUrl,
    applicationUrl: j.applicationUrl,
    publishedAt: j.publishedAt ?? null,
    firstSeenAt: j.firstSeenAt,
    lastVerifiedAt: j.lastVerifiedAt,
    lastChangedAt: j.lastChangedAt,
    status: j.status,
    missingFields: j.missingFields,
    raw: j.raw,
  }));
}