'use client'



import {

  BadgeCheck,

  Bookmark,

  Briefcase,

  Code2,

  Megaphone,

  Palette,

  PenLine,

  Shield,

  Star,

  TrendingUp,

  Video,

} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

import { useApp } from '@/application/providers/app-provider'
import type { TranslationKey } from '@/infrastructure/i18n'

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

const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'kwork_cat_design',
  writing: 'kwork_cat_writing',
  seo: 'kwork_cat_seo',
  smm: 'kwork_cat_smm',
  video: 'kwork_cat_video',
  design: 'kwork_cat_business',
  business: 'kwork_cat_business',
}



function themeForCategory(category: string) {

  const key = category.toLowerCase()

  return THUMBNAIL_THEMES[key] ?? THUMBNAIL_THEMES.web

}



function ServiceThumbnail({
  title,
  category,
  thumbnailUrl,
  sellerName,
  className,
  imagePriority,
}: {
  title: string
  category: string
  thumbnailUrl?: string
  sellerName: string
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
          quality={imagePriority ? 80 : 70}
          loading={imagePriority ? undefined : 'lazy'}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority={imagePriority}
        />
      </div>
    )
  }

  const theme = themeForCategory(category)
  const Icon = theme.icon

  return (
    <div
      data-placeholder
      className={cn(
        'ishbor-service-card__placeholder relative flex items-center justify-center overflow-hidden',
        className
      )}
      style={{
        background: `linear-gradient(160deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, white 0, transparent 42%), radial-gradient(circle at 82% 78%, white 0, transparent 38%)',
        }}
      />
      <Avatar name={sellerName} src={null} size={56} className="relative z-[1] shadow-[var(--shadow-sm)]" />
      <span className="ishbor-service-card__placeholder-cat" aria-hidden>
        <Icon className="h-3 w-3" strokeWidth={2} />
      </span>
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
      <span className="text-[11px] font-medium text-[var(--ishbor-text-muted)]">{noReviewsLabel}</span>
    )
  }

  return (

    <div className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--ishbor-text-muted)]">

      <Star className="h-3.5 w-3.5 fill-[var(--rating-filled)] text-[var(--rating-filled)]" />

      <span className="font-semibold text-[var(--ishbor-text)]">{rating.toFixed(1)}</span>

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

  const showDeliveryMeta = deliveryDays != null && deliveryDays > 0
  const showFastDelivery = showDeliveryMeta && deliveryDays <= 2
  const categoryKey = CATEGORY_LABEL_KEYS[category.toLowerCase()]
  const categoryLabel = categoryKey ? t(categoryKey) : category



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

        className="ishbor-service-card group flex cursor-pointer gap-4 p-3"

      >

        <ServiceThumbnail
          title={title}
          category={category}
          thumbnailUrl={thumbnailUrl}
          sellerName={sellerName}
          className="h-[100px] w-[160px] shrink-0 rounded-[var(--r-md)]"
          imagePriority={imagePriority}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">

          <div>

            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--ishbor-text)] group-hover:text-[var(--color-primary)]">

              {title}

            </h3>

            {description && (

              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--ishbor-text-muted)]">{description}</p>

            )}

          </div>

          <div className="flex items-end justify-between gap-2">

            <RatingBlock rating={rating} reviewCount={reviewCount} reviewLabel={reviewLabel} noReviewsLabel={noReviewsLabel} />

            <span className="text-[14px] font-bold text-[var(--color-primary)]">{formatPrice(price)}</span>

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

      className="ishbor-service-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden"

    >

      <div className="ishbor-service-card__media relative aspect-[16/10] w-full shrink-0 overflow-hidden">

        <ServiceThumbnail
          title={title}
          category={category}
          thumbnailUrl={thumbnailUrl}
          sellerName={sellerName}
          className="h-full w-full"
          imagePriority={imagePriority}
        />

        {categoryLabel ? (
          <span className="ishbor-service-card__category">{categoryLabel}</span>
        ) : null}

        {onSave && (

          <button

            type="button"

            onClick={(e) => {

              e.stopPropagation()

              onSave()

            }}

            className="absolute right-2 top-2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--ishbor-border)] bg-[var(--neutral-0)] shadow-sm transition hover:border-[var(--color-primary)]"

            aria-label={isSaved ? t('unsave') : t('save')}

          >

            <Bookmark

              className={cn(

                'h-3.5 w-3.5',

                isSaved

                  ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'

                  : 'text-[var(--ishbor-text-muted)]'

              )}

            />

          </button>

        )}

      </div>



      <div className="ishbor-service-card__body flex flex-1 flex-col">

        <h3 className="ishbor-service-card__title line-clamp-2 break-words text-[var(--ishbor-text)] transition-colors">

          {title}

        </h3>

        {showDeliveryMeta && (
          <p className="text-[11px] font-semibold text-[var(--ishbor-text-muted)]">
            {showFastDelivery ? (
              <span className="text-[var(--success)]">{t('fast_delivery_badge')}</span>
            ) : (
              t('service_card_delivery_meta').replace('{n}', String(deliveryDays))
            )}
          </p>
        )}

        <div className="flex items-center gap-2">

          <Avatar name={sellerName} size={24} />

          <span className="min-w-0 truncate text-[12px] text-[var(--ishbor-text-muted)]">{sellerName}</span>

          {isPro ? (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]"
              aria-label={t('badge_verified')}
            />
          ) : null}

        </div>



        <div className="ishbor-service-card__footer mt-auto">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="ishbor-service-card__price-label">{t('service_from')}</p>
              <p className="ishbor-service-card__price truncate">{formatPrice(price)}</p>
            </div>
            <RatingBlock
              rating={rating}
              reviewCount={reviewCount}
              reviewLabel={reviewLabel}
              noReviewsLabel={noReviewsLabel}
              compact
            />
          </div>
          <p className="ishbor-service-card__escrow-hint">
            <Shield className="h-3 w-3 shrink-0 text-[var(--success)]" aria-hidden />
            {t('card_escrow_protected')}
          </p>
        </div>

      </div>

    </article>

  )

}


