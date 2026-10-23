import React from "react";
import Link from "next/link";

export function InternLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-foreground ${className}`} aria-label="InternConnect home">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] text-sm font-black text-white shadow-xl shadow-violet-900/20 ring-2 ring-violet-400/30">
        <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" aria-hidden="true" />
        <span className="relative z-10">IC</span>
      </span>
      <span className="relative">
        <span className="relative z-10">InternConnect</span>
        <span aria-hidden="true" className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 rounded-full opacity-70" />
      </span>
    </Link>
  );
}

export function BrandHeroTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={`relative z-10 font-extrabold tracking-tight text-foreground ${className}`}>
      <span aria-hidden="true" className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 blur-2xl -z-10 rounded-3xl" />
      {children}
    </h1>
  );
}
