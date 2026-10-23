"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-depth relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-soft via-navy to-card shadow-xl">
      {/* Soft violet lighting */}
      <div
        className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-violet-600/25 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-10"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 px-6 py-16 md:px-12 md:py-24 lg:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10 shadow-[0_0_80px_rgba(139,92,246,0.14)]" aria-hidden="true" />
        <div className="mx-auto max-w-3xl text-center">
          <span className="demo-badge mb-6 inline-flex">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Demo platform — fictional listings
          </span>

          {/* Branded 3D wordmark */}
          <div className="brand-wordmark">
            <span className="brand-wordmark__text">InternConnect</span>
          </div>

          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Discover internships, fresher jobs, and entry-level roles. Every
            listing below is clearly labeled as demo data for development
            practice.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="#listings"
              className="depth-button inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30"
            >
              Browse Opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
