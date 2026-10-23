"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem("internconnect-theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    queueMicrotask(() => {
      setMounted(true);
      setTheme(initial);
    });
    applyTheme(initial);
  }, []);

  function applyTheme(next: Theme) {
    const resolved =
      next === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("internconnect-theme", next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={
        mounted && theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem]" />
      )}
    </Button>
  );
}