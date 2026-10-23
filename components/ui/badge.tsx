import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "depth-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "border-transparent bg-primary-soft text-primary":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground":
            variant === "secondary",
          "border-border text-foreground": variant === "outline",
          "border-success/20 bg-success/10 text-success":
            variant === "success",
          "border-warning/20 bg-warning/10 text-warning":
            variant === "warning",
          "border-danger/20 bg-danger/10 text-danger": variant === "danger",
        },
        className
      )}
      {...props}
    />
  );
}