/**
 * InternConnect — Real Source Storage (Phase 4)
 *
 * MongoDB is NOT currently configured (no .env.local), so this module uses an
 * in-memory implementation. The `SourceJobRepository` contract is stable so a
 * real MongoDB implementation can swap in without touching the UI.
 *
 * Deduplication is by `sourceId` (sourceType:boardToken:sourceJobId). Repeated
 * upserts update `lastSeenAt`/`lastVerifiedAt` but never create duplicates.
 *
 * Publication dates (`publishedAt`) are kept separate from discovery dates
 * (`firstSeenAt`) so we never confuse when a posting went live with when we
 * first noticed it.
 */

import type { NormalizedJob } from "@/lib/sources/types";

export interface StoredSourceJob extends NormalizedJob {
  _id: string; // same as sourceId
  firstSeenAt: string;
  lastSeenAt: string;
  lastVerifiedAt: string;
  lastChangedAt: string;
  status: "published" | "unpublished" | "closed" | "error";
  /** How many times this source has reported this posting. */
  syncCount: number;
}

export interface SourceJobRepository {
  upsert(job: NormalizedJob): Promise<{ inserted: boolean; changed: boolean }>;
  upsertMany(jobs: NormalizedJob[]): Promise<{ inserted: number; changed: number }>;
  list(options?: { limit?: number; status?: string }): Promise<StoredSourceJob[]>;
  findById(sourceId: string): Promise<StoredSourceJob | null>;
  /** Mark jobs closed only after a reliable successful source check. */
  markClosed(sourceIds: string[], verifiedAt: string): Promise<number>;
  /** Per-source last sync timestamp. */
  lastSync(sourceType: string, token: string): Promise<string | null>;
  setLastSync(sourceType: string, token: string, iso: string): Promise<void>;
  lastSuccessfulSync(): Promise<string | null>;
}

/* -------------------------------------------------------------------------- */
/* In-memory implementation (safe, no secrets, no DB required)                 */
/* -------------------------------------------------------------------------- */

const memoryStore = new Map<string, StoredSourceJob>();
const lastSyncMap = new Map<string, string>();

function isoNow(): string {
  return new Date().toISOString();
}

export const memorySourceJobRepository: SourceJobRepository = {
  async upsert(job) {
    const now = isoNow();
    const existing = memoryStore.get(job.sourceId);
    const firstSeenAt = existing?.firstSeenAt ?? job.firstSeenAt ?? now;
    const changed = Boolean(
      existing &&
        (existing.title !== job.title ||
          existing.description !== job.description ||
          existing.location !== job.location ||
          existing.applicationUrl !== job.applicationUrl ||
          existing.status !== job.status)
    );
    const lastChangedAt = existing
      ? changed
        ? now
        : existing.lastChangedAt
      : now;

    const stored: StoredSourceJob = {
      ...job,
      _id: job.sourceId,
      firstSeenAt,
      lastSeenAt: now,
      lastVerifiedAt: job.lastVerifiedAt ?? now,
      lastChangedAt,
      status: job.status,
      syncCount: (existing?.syncCount ?? 0) + 1,
    };
    memoryStore.set(job.sourceId, stored);
    return {
      inserted: !existing,
      changed,
    };
  },

  async upsertMany(jobs) {
    let inserted = 0;
    let changed = 0;
    for (const job of jobs) {
      const r = await this.upsert(job);
      if (r.inserted) inserted += 1;
      if (r.changed) changed += 1;
    }
    return { inserted, changed };
  },

  async list(options) {
    let all = Array.from(memoryStore.values());
    if (options?.status) all = all.filter((j) => j.status === options.status);
    if (options?.limit) all = all.slice(0, options.limit);
    return all;
  },

  async findById(sourceId) {
    return memoryStore.get(sourceId) ?? null;
  },

  async markClosed(sourceIds, verifiedAt) {
    let n = 0;
    for (const id of sourceIds) {
      const existing = memoryStore.get(id);
      if (existing) {
        existing.status = "closed";
        existing.lastVerifiedAt = verifiedAt;
        existing.lastChangedAt = isoNow();
        n += 1;
      }
    }
    return n;
  },

  async lastSync(sourceType, token) {
    return lastSyncMap.get(`${sourceType}:${token}`) ?? null;
  },

  async setLastSync(sourceType, token, iso) {
    lastSyncMap.set(`${sourceType}:${token}`, iso);
  },

  async lastSuccessfulSync() {
    const values = Array.from(lastSyncMap.values());
    return values.sort().at(-1) ?? null;
  },
};

/**
 * The repository the app uses today. Swap this constant for a MongoDB-backed
 * implementation once MONGODB_URI is configured and tested.
 */
export const sourceJobRepository: SourceJobRepository = memorySourceJobRepository;