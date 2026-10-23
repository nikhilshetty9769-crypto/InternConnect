import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SavedJobsProvider } from "@/components/saved-jobs-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { InternLogo } from "@/components/brand-logo";
import { ApplicationTrackerProvider } from "@/components/application-tracker-provider";
import { ProfileProvider } from "@/components/profile-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "InternConnect — Student Job & Internship Platform",
  description:
    "Discover internships, fresher jobs, and entry-level opportunities. Built for students by students.",
  openGraph: {
    title: "InternConnect",
    description: "Find internships that build your future.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <SavedJobsProvider>
          <ProfileProvider>
            <ApplicationTrackerProvider>
              <div className="flex min-h-screen flex-col">
                <header className="depth-surface sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
                  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <InternLogo />
                    <nav className="flex items-center gap-4 md:gap-6" aria-label="Main navigation">
                      <Link href="/#listings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Listings</Link>
                      <a href="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Profile</a>
                      <a href="/saved" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Saved</a>
                      <a href="/applications" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Applications</a>
                      <a href="/latest-opportunities" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Latest</a>
                      <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Dashboard</a>
                      <ThemeToggle />
                      <MobileNav />
                    </nav>
                  </div>
                </header>
                <main className="flex-grow">{children}</main>
                <footer className="depth-surface mt-16 border-t border-border bg-card">
                  <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">InternConnect</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          A platform for students exploring internships and entry-level roles. Home listings are synthetic demo data. The Latest Opportunities page displays verified listings from configured career boards.
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">Demo data on home · Verified listings on Latest Opportunities</div>
                    </div>
                  </div>
                </footer>
              </div>
            </ApplicationTrackerProvider>
          </ProfileProvider>
        </SavedJobsProvider>
      </body>
    </html>
  );
}
