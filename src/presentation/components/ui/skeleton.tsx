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
