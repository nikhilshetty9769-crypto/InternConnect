"use client";

import * as React from "react";
import type { TrackedApplication, ApplicationStatus } from "@/lib/types";

const STORAGE_KEY = "internconnect-tracked-apps";

interface TrackerContextValue {
  tracked: TrackedApplication[];
  track: (jobId: string, status: ApplicationStatus, notes?: string) => void;
  updateStatus: (jobId: string, status: ApplicationStatus) => void;
  updateNotes: (jobId: string, notes: string) => void;
  remove: (jobId: string) => void;
  isTracked: (jobId: string) => boolean;
  getTracked: (jobId: string) => TrackedApplication | undefined;
  countByStatus: (status: ApplicationStatus) => number;
  hydrated: boolean;
}

const TrackerContext = React.createContext<TrackerContextValue | null>(null);

export function ApplicationTrackerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tracked, setTracked] = React.useState<TrackedApplication[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Defensive: drop entries that don't have the required fields.
          const valid = parsed.filter(
            (t: unknown) =>
              typeof t === "object" &&
              t !== null &&
              typeof (t as TrackedApplication).jobId === "string" &&
              typeof (t as TrackedApplication).status === "string"
          );
          queueMicrotask(() => setTracked(valid as TrackedApplication[]));
        }
      }
    } catch {
      // Corrupt storage — fall back to empty.
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  const persist = React.useCallback((next: TrackedApplication[]) => {
    setTracked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota / private mode — keep in-memory.
    }
  }, []);

  const track = React.useCallback(
    (jobId: string, status: ApplicationStatus, notes?: string) => {
      persist([
        ...tracked.filter((t) => t.jobId !== jobId),
        {
          jobId,
          status,
          appliedDate:
            new Date().toISOString().split("T")[0],
          notes: notes || "",
          updatedAt: new Date().toISOString(),
        },
      ]);
    },
    [tracked, persist]
  );

  const updateStatus = React.useCallback(
    (jobId: string, status: ApplicationStatus) => {
      persist(
        tracked.map((t) =>
          t.jobId === jobId ? { ...t, status, updatedAt: new Date().toISOString() } : t
        )
      );
    },
    [tracked, persist]
  );

  const updateNotes = React.useCallback(
    (jobId: string, notes: string) => {
      persist(
        tracked.map((t) =>
          t.jobId === jobId ? { ...t, notes, updatedAt: new Date().toISOString() } : t
        )
      );
    },
    [tracked, persist]
  );

  const remove = React.useCallback(
    (jobId: string) => persist(tracked.filter((t) => t.jobId !== jobId)),
    [tracked, persist]
  );

  const isTracked = React.useCallback(
    (jobId: string) => tracked.some((t) => t.jobId === jobId),
    [tracked]
  );

  const getTracked = React.useCallback(
    (jobId: string) => tracked.find((t) => t.jobId === jobId),
    [tracked]
  );

  const countByStatus = React.useCallback(
    (status: ApplicationStatus) => tracked.filter((t) => t.status === status).length,
    [tracked]
  );

  const value = React.useMemo(
    () => ({
      tracked,
      track,
      updateStatus,
      updateNotes,
      remove,
      isTracked,
      getTracked,
      countByStatus,
      hydrated,
    }),
    [tracked, track, updateStatus, updateNotes, remove, isTracked, getTracked, countByStatus, hydrated]
  );

  return (
    <TrackerContext.Provider value={value}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = React.useContext(TrackerContext);
  if (!ctx) {
    throw new Error("useTracker must be used within ApplicationTrackerProvider");
  }
  return ctx;
}
