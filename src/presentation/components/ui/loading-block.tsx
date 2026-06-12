'use client'

import { useApp } from '@/application/providers/app-provider'
import { SkeletonCard, SkeletonFreelancerCard } from '@/presentation/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

type LoadingBlockVariant = 'default' | 'catalog-services' | 'catalog-freelancers'

export function LoadingBlock({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: LoadingBlockVariant
}) {
  const { t } = useApp()

  if (variant === 'catalog-services') {
    return (
      <div className={cn('layout-container max-w-[1280px] py-8', className)} aria-busy="true" aria-live="polite">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
        <div className="ishbor-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <span className="sr-only">{t('loading_data')}</span>
      </div>
    )
  }

  if (variant === 'catalog-freelancers') {
    return (
      <div className={cn('layout-container max-w-[1280px] py-8', className)} aria-busy="true" aria-live="polite">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
        <div className="freelancer-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonFreelancerCard key={i} />
          ))}
        </div>
        <span className="sr-only">{t('loading_data')}</span>
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-spinner" aria-hidden />
      <p className="text-[14px] text-[var(--ishbor-text-sub)]">{t('loading_data')}</p>
    </div>
  )
}
