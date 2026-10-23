"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ROLES, LOCATIONS, SKILLS, JOB_TYPES } from "@/lib/demo-data";
import { SORT_OPTIONS, DEFAULT_FILTERS, type JobFilters } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  ...ROLES.map((r) => ({ value: r, label: r })),
];

export interface FilterPanelProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  resultCount: number;
  sourceSummary?: string;
}

export function FilterPanel({ filters, onChange, resultCount, sourceSummary = "Demo data" }: FilterPanelProps) {
  const update = (key: keyof JobFilters, value: string) => {
    onChange({ ...filters, [key]: value } as JobFilters);
  };

  const reset = () => {
    onChange({ ...DEFAULT_FILTERS });
  };

  // Individual removable chips for every active filter.
  const chips: { key: keyof JobFilters; label: string }[] = [];
  if (filters.query)
    chips.push({ key: "query", label: `Search: “${filters.query}”` });
  if (filters.role !== "all")
    chips.push({ key: "role", label: filters.role });
  if (filters.type !== "all")
    chips.push({ key: "type", label: filters.type });
  if (filters.paid !== "all")
    chips.push({ key: "paid", label: filters.paid === "paid" ? "Paid" : "Unpaid" });
  if (filters.location !== "all")
    chips.push({ key: "location", label: filters.location });
  if (filters.remote !== "all")
    chips.push({
      key: "remote",
      label: filters.remote === "remote" ? "Remote" : "On-site",
    });
  if (filters.skill !== "all")
    chips.push({ key: "skill", label: filters.skill });

  return (
    <section
      aria-label="Search and filters"
      className="depth-surface sticky top-0 z-30 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-sm transition-all"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
            placeholder="Search roles, companies, skills..."
            className="pl-9 h-10 bg-background"
            aria-label="Search jobs"
          />
          {filters.query && (
            <button
              onClick={() => update("query", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Select
            value={filters.role}
            onChange={(e) => update("role", e.target.value)}
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
            aria-label="Filter by job type"
          >
            <option value="all">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Select
            value={filters.paid}
            onChange={(e) => update("paid", e.target.value)}
            aria-label="Filter by pay"
          >
            <option value="all">All pay</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </Select>

          <Select
            value={filters.location}
            onChange={(e) => update("location", e.target.value)}
            aria-label="Filter by location"
          >
            <option value="all">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>

          <Select
            value={filters.remote}
            onChange={(e) => update("remote", e.target.value)}
            aria-label="Filter by work model"
          >
            <option value="all">All models</option>
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
          </Select>

          <Select
            value={filters.skill}
            onChange={(e) => update("skill", e.target.value)}
            aria-label="Filter by skill"
          >
            <option value="all">All skills</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
            aria-label="Sort results"
            className="w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="shrink-0"
            aria-label="Clear all filters"
            disabled={chips.length === 0}
          >
            Reset
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Active filters">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() =>
                update(chip.key, chip.key === "query" ? "" : "all")
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/50"
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Showing {resultCount} result{resultCount !== 1 ? "s" : ""} · {sourceSummary}
      </p>
    </section>
  );
}