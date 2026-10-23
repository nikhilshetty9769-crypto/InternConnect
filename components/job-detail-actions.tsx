"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, ClipboardList, Info } from "lucide-react";
import { useSavedJobs } from "@/components/saved-jobs-provider";
import { useTracker } from "@/components/application-tracker-provider";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from "@/lib/types";

interface JobDetailActionsProps {
  jobId: string;
  jobTitle: string;
  hasApplicationLink: boolean;
  isDemo: boolean;
  applicationLink: string;
}

export function JobDetailActions({
  jobId,
  jobTitle,
  hasApplicationLink,
  isDemo,
  applicationLink,
}: JobDetailActionsProps) {
  const { isSaved, toggleSaved, hydrated: savedHydrated } = useSavedJobs();
  const { getTracked, track, updateStatus, remove, hydrated: trackHydrated } =
    useTracker();

  const saved = savedHydrated && isSaved(jobId);
  const tracked = trackHydrated ? getTracked(jobId) : undefined;

  function handleTrackChange(value: string) {
    if (value === "none") {
      remove(jobId);
      return;
    }
    const status = value as ApplicationStatus;
    if (tracked) {
      updateStatus(jobId, status);
    } else {
      track(jobId, status);
    }
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary-soft to-card border border-primary/10 px-6 py-5 md:px-8 md:py-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">
            Interested in this opportunity?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDemo
              ? "This opportunity is fictional and is provided for development and preview purposes only."
              : "This opportunity comes from a verified career-board source. Use the official employer link to apply."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isDemo && applicationLink ? (
            <a
              href={applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Apply on official site
            </a>
          ) : null}
          <button
            onClick={() => toggleSaved(jobId)}
            disabled={!savedHydrated}
            aria-pressed={saved}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
              saved
                ? "border-primary/30 bg-primary-soft text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
            } disabled:opacity-50`}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {saved ? "Saved" : "Save"}
            <span className="sr-only">{jobTitle}</span>
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="track-status"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
              Track
            </label>
            <select
              id="track-status"
              value={tracked?.status ?? "none"}
              onChange={(e) => handleTrackChange(e.target.value)}
              disabled={!trackHydrated}
              className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="none">Not tracking</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tracked && (
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${APPLICATION_STATUS_COLORS[tracked.status]}`}
        >
          Tracked locally as: {APPLICATION_STATUS_LABELS[tracked.status]}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Tracking records your intent in this browser only. It is not a
          submission to an employer
          {hasApplicationLink ? " and no application was sent." : " and no employer exists to receive one."}
        </span>
      </p>
    </div>
  );
}
