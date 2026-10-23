"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, BookmarkCheck, LayoutDashboard, User, Sparkles } from "lucide-react";
import { useSavedJobs } from "@/components/saved-jobs-provider";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { savedIds, hydrated } = useSavedJobs();
  const savedCount = hydrated ? savedIds.length : 0;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-xl">
          <nav className="mx-auto max-w-7xl px-6 py-5 flex flex-col gap-1" aria-label="Mobile navigation">
            <Link href="/#listings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Sparkles className="h-4 w-4 text-primary" /> Browse listings
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <User className="h-4 w-4 text-primary" /> My profile
            </Link>
            <Link href="/saved" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <BookmarkCheck className="h-4 w-4 text-primary" /> Saved jobs ({savedCount})
            </Link>
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
