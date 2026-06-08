'use client'

import { BadgeCheck, ChevronRight, MapPin, Star } from 'lucide-react'
import { Avatar } from '@/presentation/components/ui/avatar'
import { useApp } from '@/application/providers/app-provider'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export interface FreelancerCardProps {
  name: string
  specialty?: string | null
  region?: string | null
  rating?: number
  reviewCount?: number
  minPrice?: number
  isVerified?: boolean
  variant?: 'grid' | 'row'
  onClick?: () => void
  className?: string
}

export function FreelancerCard({
  name,
  specialty,
  region,
  rating = 0,
  reviewCount = 0,
  minPrice,
  isVerified,
  variant = 'grid',
  onClick,
  className,
}: FreelancerCardProps) {
  const { t } = useApp()
  const hasRating = rating > 0 && reviewCount > 0
  const subtitle = specialty?.trim() ? specialty : t('role_freelancer')

  const cardProps = {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.()
      }
    },
  }

  if (variant === 'row') {
    return (
      <article
        {...cardProps}
        className={cn(
          'kwork-freelancer-card group flex cursor-pointer items-center gap-4 p-4',
          className
        )}
      >
        <div className="shrink-0">
          <Avatar name={name} size={56} verified={isVerified} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-[15px] font-bold text-[var(--kwork-text)] group-hover:text-[var(--color-primary)]">
            {name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-[var(--kwork-text-muted)]">{subtitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <RatingLine hasRating={hasRating} rating={rating} reviewCount={reviewCount} noReviewsLabel={t('badge_new_seller')} />
            {region && <RegionPill region={region} />}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--kwork-text-muted)] transition group-hover:text-[var(--color-primary)]" />
      </article>
    )
  }

  return (
    <article
      {...cardProps}
      className={cn(
        'kwork-freelancer-card group flex h-full cursor-pointer flex-col overflow-hidden',
        className
      )}
    >
      <div className="flex flex-1 flex-col items-center px-4 pb-3 pt-5 text-center">
        <div className="mb-3 shrink-0">
          <Avatar name={name} size={64} verified={isVerified} />
        </div>
        <h3 className="line-clamp-1 flex w-full items-center justify-center gap-1 text-[15px] font-bold text-[var(--kwork-text)] group-hover:text-[var(--color-primary)]">
          <span className="truncate">{name}</span>
          {isVerified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" aria-label={t('badge_verified')} />
          )}
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] w-full text-[13px] leading-snug text-[var(--kwork-text-muted)]">
          {subtitle}
        </p>
      </div>

      <div className="border-t border-[var(--kwork-border)] bg-[var(--neutral-50)] px-4 py-3">
        <div className="flex flex-col gap-2">
          <RatingLine
            hasRating={hasRating}
            rating={rating}
            reviewCount={reviewCount}
            noReviewsLabel={t('badge_new_seller')}
            centered
          />
          {region && <RegionPill region={region} centered />}
        </div>
        {minPrice != null && minPrice > 0 && (
          <p className="mt-2.5 text-center text-[13px] font-semibold text-[var(--kwork-text)]">
            {t('starting_at')}{' '}
            <span className="text-[var(--color-primary)]">{formatPrice(minPrice)}</span>
          </p>
        )}
        <p className="mt-2.5 flex items-center justify-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] opacity-80 transition group-hover:opacity-100">
          {t('view_profile')}
          <ChevronRight className="h-3.5 w-3.5" />
        </p>
      </div>
    </article>
  )
}

function RatingLine({
  hasRating,
  rating,
  reviewCount,
  noReviewsLabel,
  centered,
}: {
  hasRating: boolean
  rating: number
  reviewCount: number
  noReviewsLabel: string
  centered?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        centered ? 'justify-center' : 'justify-start'
      )}
    >
      <Star
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          hasRating
            ? 'fill-[var(--rating-filled)] text-[var(--rating-filled)]'
            : 'text-[var(--kwork-text-muted)]'
        )}
      />
      {hasRating ? (
        <>
          <span className="text-[13px] font-bold text-[var(--kwork-text)]">{rating.toFixed(1)}</span>
          <span className="text-[12px] text-[var(--kwork-text-muted)]">({reviewCount})</span>
        </>
      ) : (
        <span className="truncate text-[12px] text-[var(--kwork-text-muted)]">{noReviewsLabel}</span>
      )}
    </div>
  )
}

function RegionPill({ region, centered }: { region: string; centered?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 text-[12px] text-[var(--kwork-text-muted)]',
        centered && 'mx-auto justify-center'
      )}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{region}</span>
    </span>
  )
}
