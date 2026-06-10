import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer animate-pulse rounded-[var(--r-md)] bg-[var(--color-bg-muted)]',
        className
      )}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 'h-8', md: 'h-10', lg: 'h-12' }
  return <Skeleton className={cn('w-24 rounded-[var(--r-md)]', heights[size])} />
}

/** Matches FreelancerCard grid variant */
export function SkeletonFreelancerCard() {
  return (
    <div className="ishbor-freelancer-card overflow-hidden">
      <div className="flex flex-col items-center px-4 pb-3 pt-5">
        <Skeleton className="mb-3 h-16 w-16 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3.5 w-full max-w-[180px]" />
        <Skeleton className="mt-1 h-3.5 w-24" />
      </div>
      <div className="border-t border-[var(--ishbor-border)] bg-[var(--neutral-50)] px-4 py-3">
        <Skeleton className="mx-auto h-3.5 w-28" />
        <Skeleton className="mx-auto mt-2 h-3 w-24" />
      </div>
    </div>
  )
}

/** Matches Kwork-style ServiceCard */
export function SkeletonCard() {
  return (
    <div className="ishbor-service-card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-[var(--color-bg-muted)]" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <div className="flex justify-between border-t border-[var(--ishbor-border)] pt-3">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Alias for job listings */
export const SkeletonJobCard = SkeletonCard

/** Dashboard order / project list row */
export function SkeletonListRow({ lines = 2 }: { lines?: 1 | 2 | 3 }) {
  return (
    <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4">
      <Skeleton className="h-4 w-2/3" />
      {lines >= 2 && <Skeleton className="mt-2 h-3 w-1/2" />}
      {lines >= 3 && <Skeleton className="mt-3 h-8 w-28" />}
    </div>
  )
}

/** Post-project / auth form loading placeholder */
export function SkeletonFormPanel() {
  return (
    <div className="form-shell animate-pulse space-y-4 rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-6">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-4 h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/** Freelancer profile hero */
export function SkeletonProfileHero() {
  return (
    <div className="animate-pulse space-y-4 px-4 py-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}

/** Marketplace / dashboard detail page (contract, dispute, escrow) */
export function SkeletonDashboardDetail() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6" role="status" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

/** Escrow KPI cards + table placeholder */
export function SkeletonEscrowDashboard() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6" role="status" aria-live="polite">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

/** Chat panel while inbox loads */
export function SkeletonChatPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6" role="status" aria-live="polite">
      <div className="w-full max-w-sm space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn('flex gap-2', i % 2 === 1 && 'flex-row-reverse')}>
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-[70%]' : 'w-[55%]')} />
          </div>
        ))}
      </div>
    </div>
  )
}
