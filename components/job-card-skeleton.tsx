export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex gap-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-12 rounded-full bg-muted" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-6 w-14 rounded-md bg-muted" />
        <div className="h-6 w-16 rounded-md bg-muted" />
        <div className="h-6 w-10 rounded-md bg-muted" />
      </div>
    </div>
  );
}