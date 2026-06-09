'use client'



import {

  Bookmark,

  Briefcase,

  Code2,

  Megaphone,

  Palette,

  PenLine,

  Star,

  TrendingUp,

  Video,

} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

import { useApp } from '@/application/providers/app-provider'

import { Avatar } from '@/presentation/components/ui/avatar'

import { formatPrice } from '@/shared/lib/format'

import { cn } from '@/shared/lib/utils'
import Image from 'next/image'



export interface ServiceCardProps {

  title: string

  sellerName: string

  sellerAvatar?: string

  sellerInitials: string

  rating: number

  reviewCount: number

  price: number

  category: string

  thumbnailUrl?: string

  isPro?: boolean

  isSaved?: boolean

  description?: string

  deliveryDays?: number

  view?: 'grid' | 'list' | 'kwork'

  onSave?: () => void

  onOrder?: (e: React.MouseEvent) => void

  onClick?: () => void

  imagePriority?: boolean

}



const THUMBNAIL_THEMES: Record<string, { from: string; to: string; icon: LucideIcon; tint: string }> = {

  web: { from: 'var(--brand-50)', to: 'var(--brand-100)', icon: Code2, tint: 'var(--color-primary)' },

  mobile: { from: 'var(--brand-50)', to: 'var(--brand-200)', icon: Code2, tint: 'var(--color-primary)' },

  uiux: { from: 'var(--neutral-50)', to: 'var(--neutral-100)', icon: Palette, tint: 'var(--avatar-pink)' },

  graphic: { from: 'var(--neutral-50)', to: 'var(--neutral-100)', icon: Palette, tint: 'var(--avatar-pink)' },

  writing: { from: 'var(--success-bg)', to: 'var(--neutral-50)', icon: PenLine, tint: 'var(--success)' },

  seo: { from: 'var(--warning-bg)', to: 'var(--neutral-50)', icon: TrendingUp, tint: 'var(--warning)' },

  smm: { from: 'var(--neutral-50)', to: 'var(--neutral-100)', icon: Megaphone, tint: 'var(--avatar-purple)' },

  video: { from: 'var(--neutral-50)', to: 'var(--neutral-100)', icon: Video, tint: 'var(--avatar-sky)' },

  design: { from: 'var(--neutral-50)', to: 'var(--neutral-100)', icon: Briefcase, tint: 'var(--neutral-600)' },

}



function themeForCategory(category: string) {

  const key = category.toLowerCase()

  return THUMBNAIL_THEMES[key] ?? THUMBNAIL_THEMES.web

}



function ServiceThumbnail({

  title,

  category,

  thumbnailUrl,

  className,

  imagePriority,

}: {

  title: string

  category: string

  thumbnailUrl?: string

  className?: string

  imagePriority?: boolean

}) {

  if (thumbnailUrl) {
    return (
      <div className={cn('relative h-full w-full', className)}>
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
          priority={imagePriority}
        />
      </div>
    )
  }



  const theme = themeForCategory(category)

  const Icon = theme.icon



  return (

    <div

      className={cn('relative flex items-center justify-center overflow-hidden', className)}

      style={{

        background: `linear-gradient(145deg, ${theme.from} 0%, ${theme.to} 100%)`,

      }}

    >

      <div

        className="absolute inset-0 opacity-[0.35]"

        style={{

          backgroundImage:

            'radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)',

        }}

      />

      <Icon

        className="relative h-10 w-10 opacity-[0.22]"

        style={{ color: theme.tint }}

        strokeWidth={1.5}

      />

    </div>

  )

}



function RatingBlock({

  rating,

  reviewCount,

  reviewLabel,

  noReviewsLabel,

  compact,

}: {

  rating: number

  reviewCount: number

  reviewLabel: string

  noReviewsLabel: string

  compact?: boolean

}) {

  if (reviewCount <= 0) {
    return (
      <span className="service-card-badge service-card-badge--new">{noReviewsLabel}</span>
    )
  }

  return (

    <div className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--kwork-text-muted)]">

      <Star className="h-3.5 w-3.5 fill-[var(--rating-filled)] text-[var(--rating-filled)]" />

      <span className="font-semibold text-[var(--kwork-text)]">{rating.toFixed(1)}</span>

      {!compact && <span>({reviewLabel})</span>}

    </div>

  )

}



export function ServiceCard({

  title,

  sellerName,

  rating,

  reviewCount,

  price,

  category,

  thumbnailUrl,

  isPro = false,

  isSaved = false,

  description,

  deliveryDays,

  view = 'kwork',

  onSave,

  onClick,

  imagePriority,

}: ServiceCardProps) {

  const { t } = useApp()

  const reviewLabel = t('reviews_count_short').replace('{n}', String(reviewCount))
  const noReviewsLabel = t('badge_new_seller')

  const showFastDelivery = deliveryDays != null && deliveryDays <= 2



  if (view === 'list') {

    return (

      <article

        role="button"

        tabIndex={0}

        onClick={onClick}

        onKeyDown={(e) => {

          if (e.key === 'Enter' || e.key === ' ') {

            e.preventDefault()

            onClick?.()

          }

        }}

        aria-label={`${title} — ${formatPrice(price)}`}

        className="kwork-service-card group flex cursor-pointer gap-4 p-3"

      >

        <ServiceThumbnail

          title={title}

          category={category}

          thumbnailUrl={thumbnailUrl}

          className="h-[100px] w-[160px] shrink-0 rounded-[var(--r-md)]"

          imagePriority={imagePriority}

        />

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">

          <div>

            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--kwork-text)] group-hover:text-[var(--color-primary)]">

              {title}

            </h3>

            {description && (

              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--kwork-text-muted)]">{description}</p>

            )}

          </div>

          <div className="flex items-end justify-between gap-2">

            <RatingBlock rating={rating} reviewCount={reviewCount} reviewLabel={reviewLabel} noReviewsLabel={noReviewsLabel} />

            <span className="text-[14px] font-bold text-[var(--kwork-text)]">{formatPrice(price)}</span>

          </div>

        </div>

      </article>

    )

  }



  return (

    <article

      role="button"

      tabIndex={0}

      onClick={onClick}

      onKeyDown={(e) => {

        if (e.key === 'Enter' || e.key === ' ') {

          e.preventDefault()

          onClick?.()

        }

      }}

      aria-label={`${title} — ${formatPrice(price)}`}

      className="kwork-service-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden"

    >

      <div className="kwork-service-card__media relative aspect-[16/10] w-full shrink-0 overflow-hidden">

        <ServiceThumbnail

          title={title}

          category={category}

          thumbnailUrl={thumbnailUrl}

          className="h-full w-full"

          imagePriority={imagePriority}

        />

        {onSave && (

          <button

            type="button"

            onClick={(e) => {

              e.stopPropagation()

              onSave()

            }}

            className="absolute right-2 top-2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--kwork-border)] bg-[var(--neutral-0)] shadow-sm transition hover:border-[var(--color-primary)]"

            aria-label={isSaved ? t('unsave') : t('save')}

          >

            <Bookmark

              className={cn(

                'h-3.5 w-3.5',

                isSaved

                  ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'

                  : 'text-[var(--kwork-text-muted)]'

              )}

            />

          </button>

        )}

      </div>



      <div className="kwork-service-card__body flex flex-1 flex-col gap-2.5">

        <h3 className="kwork-service-card__title line-clamp-2 break-words text-[14px] font-semibold leading-snug text-[var(--kwork-text)] transition-colors">

          {title}

        </h3>

        {showFastDelivery && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-[var(--kwork-text-muted)]">
            <span className="text-[var(--success)]">{t('fast_delivery_badge')}</span>
            <span className="service-card-badge service-card-badge--escrow">{t('service_escrow_badge')}</span>
          </div>
        )}
        {!showFastDelivery && (
          <span className="service-card-badge service-card-badge--escrow w-fit">{t('service_escrow_badge')}</span>
        )}

        <div className="flex items-center gap-2">

          <Avatar name={sellerName} size={24} />

          <span className="min-w-0 truncate text-[12px] text-[var(--kwork-text-muted)]">{sellerName}</span>

          {isPro && (
            <span className="shrink-0 rounded bg-[var(--success-bg)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--success-dark)]">
              {t('profile_pro_badge')}
            </span>
          )}

        </div>



        <div className="kwork-service-card__footer mt-auto flex items-center justify-between gap-2">

          <p className="truncate text-[15px] font-bold leading-none tracking-tight text-[var(--kwork-text)]">

            {formatPrice(price)}

          </p>

          <RatingBlock

            rating={rating}

            reviewCount={reviewCount}

            reviewLabel={reviewLabel}

            noReviewsLabel={noReviewsLabel}

            compact

          />

        </div>

      </div>

    </article>

  )

}


