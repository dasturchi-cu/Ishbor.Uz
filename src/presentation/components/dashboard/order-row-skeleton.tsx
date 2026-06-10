export function OrderRowSkeleton() {
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--ishbor-border)] p-3.5">
      <div className="mb-2 flex justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--color-bg-muted)]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-bg-muted)]" />
      </div>
      <div className="h-1.5 animate-pulse rounded-full bg-[var(--color-bg-muted)]" />
    </div>
  )
}
