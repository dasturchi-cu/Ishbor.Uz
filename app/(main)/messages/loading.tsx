export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
      <div className="mt-6 h-[420px] animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
    </div>
  )
}
