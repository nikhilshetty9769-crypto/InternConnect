"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { EMPTY_PROFILE, type StudentProfile } from "@/lib/types";

const STORAGE_KEY = "internconnect-profile";

interface ProfileContextValue {
  profile: StudentProfile;
  hydrated: boolean;
  save: (next: Partial<StudentProfile>) => void;
  canEdit: boolean;
}

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StudentProfile>;
        // Only trust records that look like a valid profile shape.
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          typeof parsed.name === "string"
        ) {
          queueMicrotask(() => setProfile({ ...EMPTY_PROFILE, ...parsed }));
        }
      }
    } catch {
      // Corrupt storage — start fresh.
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  const save = useCallback((next: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...next };
      const nextProfile: StudentProfile = {
        ...merged,
        skills: Array.isArray(merged.skills) ? merged.skills : [],
        preferredRoles: Array.isArray(merged.preferredRoles) ? merged.preferredRoles : [],
        preferredLocations: Array.isArray(merged.preferredLocations) ? merged.preferredLocations : [],
        preferredWorkModes: Array.isArray(merged.preferredWorkModes) ? merged.preferredWorkModes : [],
        portfolioUrl: typeof merged.portfolioUrl === "string" ? merged.portfolioUrl : "",
        githubUrl: typeof merged.githubUrl === "string" ? merged.githubUrl : "",
        linkedinUrl: typeof merged.linkedinUrl === "string" ? merged.linkedinUrl : "",
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      } catch {
        // Quota — keep in-memory only.
      }
      return nextProfile;
    });
  }, []);

  const canEdit = useMemo(() => hydrated, [hydrated]);

  const value = useMemo(
    () => ({ profile, hydrated, save, canEdit }),
    [profile, hydrated, save, canEdit]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
