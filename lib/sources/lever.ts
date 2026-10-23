/**
 * Lever connector — Phase 3
 *
 * Official Lever Postings API:
 *   https://github.com/lever/postings-api
 *   Base: https://api.lever.co/v0/postings/{companyIdentifier}
 *   Query: mode=0 (published only), include=content
 *
 * Reads company identifier from LEVER_COMPANY_IDENTIFIER.
 * Never fabricates identifiers.
 */

import type { SourceType } from "@/lib/sources/types";
import { stripHtml } from "@/lib/sources/greenhouse";

export interface LeverPosting {
  id: string;
  text?: string;
  title?: string;
  location?: string;
  categories?: { team?: string };
  applyUrl?: string;
  hostedUrl?: string;
  description?: string;
  content?: string;
  createdAt?: number; // epoch ms
  updatedAt?: number; // epoch ms
}

export interface LeverNormalized {
  sourceType: SourceType; // "lever"
  sourceId: string; // lever:{companyId}:{jobId}
  companyId: string;
  title: string;
  companyName: string | null;
  location: string | null;
  description: string | null;
  applicationUrl: string | null;
  publicationDate: string | null;
  status: "published";
  missingFields: string[];
  raw: Record<string, unknown>;
}

export function getLeverCompanyId(): string | null {
  const t = process.env.LEVER_COMPANY_IDENTIFIER;
  if (!t || t.trim() === "" || t === "REPLACE_ME") return null;
  return t.trim();
}

function msToIso(ms?: number): string | null {
  if (ms == null) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function timeoutMs(duration: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), duration)
  );
}

export async function fetchLeverPostings(
  companyId: string,
  opts?: { timeout?: number; retries?: number }
): Promise<{ jobs: LeverNormalized[]; errors: string[]; summary: string }> {
  const errors: string[] = [];
  const jobs: LeverNormalized[] = [];
  const timeout = opts?.timeout ?? 8000;
  const maxRetries = opts?.retries ?? 1;

  if (!companyId || companyId.trim() === "") {
    errors.push("LEVER_COMPANY_IDENTIFIER is empty or missing.");
    return { jobs, errors, summary: "No Lever company configured." };
  }

  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companyId)}?mode=0&include=content`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await Promise.race([fetch(url), timeoutMs(timeout)]);

      if (!res.ok) {
        const msg = `Lever HTTP ${res.status} for company ${companyId}`;
        if (attempt === maxRetries) errors.push(msg);
        else continue;
        break;
      }

      const data = (await res.json()) as LeverPosting[];
      const postings = Array.isArray(data) ? data : [];

      for (const post of postings) {
        const missingFields: string[] = [];
        if (!post.title || post.title.trim() === "") missingFields.push("title");
        if (!post.applyUrl && !post.hostedUrl) missingFields.push("applicationUrl");
        if (!post.location || post.location.trim() === "") missingFields.push("location");

        const applicationUrl = post.applyUrl ?? post.hostedUrl ?? null;

        jobs.push({
          sourceType: "lever",
          sourceId: `lever:${companyId}:${post.id}`,
          companyId,
          title: post.title ?? "Untitled",
          companyName: null,
          location: post.location ?? null,
          description: stripHtml(post.description ?? post.content),
          applicationUrl,
          publicationDate: msToIso(post.createdAt),
          status: "published",
          missingFields,
          raw: post as unknown as Record<string, unknown>,
        });
      }

      return {
        jobs,
        errors,
        summary: `Lever company ${companyId}: ${jobs.length} postings fetched, ${errors.length} errors.`,
      };
    } catch (e: unknown) {
      const msg = `Lever fetch error: ${e instanceof Error ? e.message : String(e)}`;
      if (attempt === maxRetries) errors.push(msg);
    }
  }

  return {
    jobs,
    errors,
    summary: `Lever company ${companyId}: failed after ${maxRetries + 1} attempts. ${errors.length} errors.`,
  };
}
