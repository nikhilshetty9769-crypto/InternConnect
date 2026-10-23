"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

/**
 * Applies a `?role=` filter supplied via the URL (used by homepage category
 * links and job-detail breadcrumbs) to the listings filter state.
 *
 * Rendered inside a <Suspense> boundary because `useSearchParams()` reads URL
 * data, which Next.js requires to sit behind Suspense for static prerendering.
 */
export function RoleFilterSync({
  onRole,
}: {
  onRole: (role: string) => void;
}) {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role");

  React.useEffect(() => {
    if (urlRole) onRole(urlRole);
  }, [urlRole, onRole]);

  return null;
}
