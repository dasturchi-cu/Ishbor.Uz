'use client'

import { Star } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const

export interface RatingStarsProps {
  rating: number
  size?: keyof typeof SIZE_MAP
  showValue?: boolean
  reviewCount?: number
  reviewLabel?: string
  className?: string
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function RatingStars({
  rating,
  size = 'md',
  showValue = false,
  reviewCount,
  reviewLabel,
  className,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const { t } = useApp()
  const iconClass = SIZE_MAP[size]

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex gap-0.5" aria-hidden={!interactive}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.round(rating)
          const star = (
            <Star
              className={cn(
                iconClass,
                filled
                  ? 'fill-[var(--rating-filled)] text-[var(--rating-filled)]'
                  : 'fill-[var(--rating-empty)] text-[var(--rating-empty)]',
                interactive && 'cursor-pointer transition hover:scale-110'
              )}
            />
          )
          if (interactive && onChange) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i)}
                className="p-0.5"
                aria-label={t('rating_star_n').replace('{n}', String(i))}
              >
                {star}
              </button>
            )
          }
          return <span key={i}>{star}</span>
        })}
      </div>
      {showValue && (
        <>
          <span className="text-[13px] font-bold text-[var(--color-text)]">{rating.toFixed(1)}</span>
          {reviewCount != null && reviewLabel && (
            <span className="text-xs text-[var(--color-text-muted)]">
              ({reviewLabel.replace('{n}', String(reviewCount))})
            </span>
          )}
        </>
      )}
    </div>
  )
}
