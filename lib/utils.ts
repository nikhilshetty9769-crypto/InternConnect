/**
 * InternConnect — Shared Utilities
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeDate(dateString: string, now?: Date): string {
  const date = new Date(dateString);
  const reference = now ?? new Date();
  const diffMs = date.getTime() - reference.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `${diffDays} days left`;
  return formatDate(dateString);
}

export function formatCompensation(
  comp?: { min: number; max: number; currency: string; period: string },
  paid: boolean = true
): string {
  if (!paid || !comp) return "Unpaid";
  const { min, max, currency, period } = comp;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

  if (min === max) return `${fmt(min)}/${period}`;
  return `${fmt(min)}–${fmt(max)}/${period}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  Remote: "bg-primary-soft text-primary border-primary/20",
  "On-site": "bg-secondary text-secondary-foreground border-border",
  Hybrid: "bg-accent/10 text-accent border-accent/20",
};

export const JOB_TYPE_COLORS: Record<string, string> = {
  Internship: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "Full-time": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  "Part-time": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  Contract: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  "Co-op": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export const PAID_STATUS_COLORS = {
  true: "bg-success/10 text-success border-success/20",
  false: "bg-warning/10 text-warning border-warning/20",
} as const;

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}