"use client";

import * as React from "react";

const STORAGE_KEY = "internconnect-saved-jobs";

/**
 * Phase 1 save-job interaction.
 *
 * Persists saved job IDs to localStorage. In a later phase this swaps for a
 * server-backed store scoped to the authenticated student.
 */
export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setSavedIds(parsed));
        }
      }
    } catch {
      // Corrupt storage — fall back to empty list.
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  const toggleSaved = React.useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode / quota) — keep in-memory state.
      }
      return next;
    });
  }, []);

  const isSaved = React.useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const clearSaved = React.useCallback(() => {
    setSavedIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }, []);

  const value = React.useMemo(
    () => ({ savedIds, isSaved, toggleSaved, clearSaved, hydrated }),
    [savedIds, isSaved, toggleSaved, clearSaved, hydrated]
  );

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
}

interface SavedJobsContextValue {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  clearSaved: () => void;
  hydrated: boolean;
}

const SavedJobsContext = React.createContext<SavedJobsContextValue | null>(null);

export function useSavedJobs() {
  const ctx = React.useContext(SavedJobsContext);
  if (!ctx) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return ctx;
}