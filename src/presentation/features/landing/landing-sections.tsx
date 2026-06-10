'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Award,
  ChevronRight,
  CreditCard,
  Headphones,
  Languages,
  Rocket,
  Shield,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { PATHS, freelancerPath } from '@/domain/constants/routes'
import type { ApiPublicStats, ApiPublicReview } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { Button } from '@/presentation/components/ui/button'
import { FreelancerCard } from '@/presentation/components/features/freelancer-card'
import { api } from '@/infrastructure/api/client'
import { trackFunnelEvent } from '@/shared/lib/funnel-analytics'

const HOW_STEPS: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: 'how_step1_title', descKey: 'how_step1_desc' },
  { titleKey: 'how_step2_title', descKey: 'how_step2_desc' },
  { titleKey: 'how_step3_title', descKey: 'how_step3_desc' },
]

const TRUST_ITEMS: { icon: LucideIcon; labelKey: TranslationKey }[] = [
  { icon: Shield, labelKey: 'trust_escrow' },
  { icon: CreditCard, labelKey: 'trust_item_pay' },
  { icon: Award, labelKey: 'trust_item_cert' },
  { icon: Languages, labelKey: 'trust_item_lang' },
  { icon: Rocket, labelKey: 'trust_withdrawal' },
  { icon: Headphones, labelKey: 'trust_item_support' },
]

const FEATURE_TABS: { id: string; labelKey: TranslationKey; cats: string[] }[] = [
  { id: 'all', labelKey: 'landing_all_tab', cats: [] },
  { id: 'design', labelKey: 'kwork_cat_design', cats: ['graphic', 'uiux'] },
  { id: 'dev', labelKey: 'kwork_cat_dev', cats: ['web', 'mobile'] },
  { id: 'smm', labelKey: 'kwork_cat_smm', cats: ['smm'] },
  { id: 'video', labelKey: 'kwork_cat_video', cats: ['video'] },
]

function formatStat(n: number, emptyLabel: string): string {
  if (n <= 0) return emptyLabel
  return n >= 1000 ? `${Math.round(n / 100) / 10}k+`.replace('.0k', 'k') : `${n}+`
}

export function LandingHeroBadge() {
  const { t } = useApp()
  return (
    <span className="landing-hero-badge">
      <Shield className="h-3.5 w-3.5" aria-hidden />
      {t('marketplace_tagline')}
    </span>
  )
}

export function LandingStatsRow({ stats }: { stats: ApiPublicStats }) {
  const { t } = useApp()
  const items = [
    stats.services > 0 && {
      value: formatStat(stats.services, ''),
      label: t('landing_stat_services'),
    },
    stats.freelancers > 0 && {
      value: formatStat(stats.freelancers, ''),
      label: t('landing_stat_freelancers'),
    },
    stats.review_count > 0 && {
      value: formatStat(stats.review_count, ''),
      label: t('landing_stat_reviews'),
    },
    stats.avg_rating > 0 && {
      value: stats.avg_rating.toFixed(1),
      label: t('landing_stat_rating'),
    },
  ].filter((item): item is { value: string; label: string } => Boolean(item))

  if (items.length === 0) return null

  return (
    <div>
      <div className="landing-stats-grid">
        {items.map((item) => (
          <div key={item.label} className="landing-stats-card">
            <p className="landing-stats-value">{item.value}</p>
            <p className="landing-stats-label">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingHowItWorks() {
  const { t } = useApp()
  return (
    <section className="landing-how-section">
      <div className="layout-container max-w-[1280px]">
        <h2 className="landing-section-heading">{t('how_it_works_title')}</h2>
        <ol className="landing-how-steps-list">
          {HOW_STEPS.map((step, i) => (
            <li key={step.titleKey} className="landing-how-steps-list__item">
              <span className="landing-how-steps-list__num" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="landing-how-steps-list__title">{t(step.titleKey)}</h3>
                <p className="landing-how-steps-list__desc">{t(step.descKey)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <Link href={PATHS.services}>
            <Button variant="primary" size="lg" className="landing-cta-btn min-w-[200px]">
              {t('browse_services')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function LandingCategoryGrid({ stats }: { stats: ApiPublicStats }) {
  const { t } = useApp()
  const router = useRouter()

  return (
    <section className="layout-container max-w-[1280px] py-10 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="landing-section-heading mb-0 text-left">{t('categories_browse_title')}</h2>
        <Link
          href={PATHS.services}
          className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
        >
          {t('view_all')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="landing-category-grid">
        {KWORK_CATEGORY_ITEMS.slice(0, 8).map((item) => {
          const count = stats.category_counts?.[item.cat] ?? 0
          const Icon = item.icon
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => router.push(`${PATHS.services}?cat=${item.cat}`)}
              className="landing-category-card"
            >
              <span className="landing-category-card-icon">
                <Icon className="h-5 w-5" />
              </span>
              <span className="landing-category-card-label">{t(item.labelKey)}</span>
              <span className="landing-category-card-count">
                {count > 0
                  ? `${count} ${t('services_count_suffix')}`
                  : t('category_explore_cta')}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function LandingFeaturedTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (id: string) => void
}) {
  const { t } = useApp()
  return (
    <div className="landing-featured-tabs">
      {FEATURE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn('landing-featured-tab', activeTab === tab.id && 'landing-featured-tab--active')}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}

export function filterServicesByTab<T extends { category: string }>(
  services: T[],
  tabId: string
): T[] {
  const tab = FEATURE_TABS.find((t) => t.id === tabId)
  if (!tab || tab.cats.length === 0) return services
  return services.filter((s) => tab.cats.includes(s.category))
}

type TestimonialCard = { quote: string; author: string; rating: number }

export function LandingTestimonials() {
  const { t } = useApp()
  const [items, setItems] = useState<TestimonialCard[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api
      .listPublicReviews(3)
      .then((revs: ApiPublicReview[]) => {
        if (revs.length > 0) {
          setItems(
            revs.map((r) => ({
              quote: r.comment,
              author: `${r.author_name}${r.author_role ? `, ${r.author_role}` : ''}`,
              rating: r.rating,
            }))
          )
        } else {
          setItems([])
        }
      })
      .catch((e) => {
        ignoreWithLog(e, { scope: 'reviews', apiPath: '/api/v1/reviews/public' })
        setItems([])
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <section className="landing-testimonials-section" aria-busy="true">
        <div className="layout-container max-w-[1280px]">
          <div className="landing-testimonials-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="landing-testimonial-card animate-pulse">
                <div className="mb-3 h-4 w-24 rounded bg-[var(--ishbor-bg-muted)]" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[var(--ishbor-bg-muted)]" />
                  <div className="h-3 w-5/6 rounded bg-[var(--ishbor-bg-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="landing-testimonials-section">
        <div className="layout-container max-w-[1280px]">
          <h2 className="landing-section-heading">{t('clients_say')}</h2>
          <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-[var(--ishbor-text)]">{t('landing_empty_testimonials_title')}</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--ishbor-text-muted)]">
              {t('landing_empty_testimonials_desc')}
            </p>
            <Link href={PATHS.services} className="mt-5 inline-block">
              <Button variant="primary">{t('browse_services')}</Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="landing-testimonials-section">
      <div className="layout-container max-w-[1280px]">
        <h2 className="landing-section-heading">{t('clients_say')}</h2>
        <div className="landing-testimonials-grid">
          {items.map((item, idx) => (
            <article key={idx} className="landing-testimonial-card">
              <div className="flex gap-0.5" role="img" aria-label={t('rating_stars_aria').replace('{rating}', String(item.rating))}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.round(item.rating)
                        ? 'fill-[var(--warning)] text-[var(--warning)]'
                        : 'fill-[var(--rating-empty)] text-[var(--rating-empty)]'
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="landing-testimonial-quote">&ldquo;{item.quote}&rdquo;</p>
              <p className="landing-testimonial-author">{item.author}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingTopFreelancers({ stats }: { stats: ApiPublicStats }) {
  const { t } = useApp()
  const router = useRouter()
  const freelancers = stats.featured_freelancers.slice(0, 4)

  if (freelancers.length === 0) {
    return (
      <section className="page-section">
        <div className="layout-container max-w-[1280px]">
          <h2 className="landing-section-heading mb-4 text-left">{t('featured_freelancers')}</h2>
          <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-[var(--ishbor-text)]">{t('landing_empty_freelancers_title')}</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--ishbor-text-muted)]">
              {t('landing_empty_freelancers_desc')}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href={PATHS.register}>
                <Button variant="primary">{t('register')}</Button>
              </Link>
              <Link href={PATHS.freelancers}>
                <Button variant="outline">{t('nav_freelancers')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="layout-container max-w-[1280px]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="landing-section-heading mb-0 text-left">{t('featured_freelancers')}</h2>
          <Link
            href={PATHS.freelancers}
            className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
          >
            {t('view_all')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {freelancers.map((f) => (
            <FreelancerCard
              key={f.id}
              name={f.full_name ?? t('freelancer')}
              specialty={f.specialty}
              region={f.region}
              rating={f.avg_rating ?? 0}
              reviewCount={f.review_count ?? 0}
              minPrice={f.min_price}
              isVerified={Boolean(f.is_verified)}
              trustScore={f.trust_score}
              onClick={() => router.push(freelancerPath(f.id))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingRecentActivity({ stats }: { stats: ApiPublicStats }) {
  const { t } = useApp()
  const events = stats.recent_activity ?? []
  if (events.length === 0) return null

  return (
    <section className="layout-container max-w-[1280px] py-6 md:py-8">
      <h2 className="landing-section-heading mb-4 text-left">{t('landing_recent_activity_title')}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {events.slice(0, 6).map((event) => {
          const label =
            event.kind === 'order_completed'
              ? t('landing_activity_order_done').replace('{title}', event.title ?? '')
              : event.kind === 'new_service'
                ? t('landing_activity_new_service').replace('{title}', event.title ?? '')
                : t('landing_activity_new_freelancer')
          return (
            <li
              key={event.id}
              className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-3 text-[13px] text-[var(--ishbor-text)]"
            >
              <span className="font-medium">{label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function LandingDarkTrust() {
  const { t } = useApp()
  return (
    <section className="landing-trust-band border-t border-[var(--ishbor-border)] bg-[var(--neutral-50)] py-12 md:py-14">
      <div className="layout-container max-w-[1280px]">
        <h2 className="mb-6 text-[length:var(--text-h3)] font-bold tracking-tight text-[var(--ishbor-text)]">
          {t('trust_section_title')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map(({ icon: Icon, labelKey }) => (
            <li
              key={labelKey}
              className="flex items-start gap-3 rounded-[var(--r-lg)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              {labelKey === 'trust_item_support' || labelKey === 'trust_item_cert' ? (
                <Link
                  href={PATHS.help}
                  className="pt-2 text-[14px] font-medium text-[var(--ishbor-text)] hover:text-[var(--color-primary)]"
                >
                  {t(labelKey)}
                </Link>
              ) : (
                <span className="pt-2 text-[14px] font-medium text-[var(--ishbor-text)]">{t(labelKey)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function LandingCtaBanner() {
  const { t, isLoggedIn, isAuthLoading } = useApp()
  const router = useRouter()
  return (
    <section className="layout-container max-w-[1280px] py-12 md:py-16">
      <div className="flex flex-col gap-6 rounded-[var(--r-xl)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-6 py-8 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
        <div className="max-w-xl">
          <h2 className="text-[length:var(--text-h3)] font-bold tracking-tight text-[var(--ishbor-text)]">
            {t('cta_banner_title')}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ishbor-text-muted)]">{t('cta_banner_sub')}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {!isAuthLoading && !isLoggedIn ? (
            <Button
              variant="primary"
              size="lg"
              className="min-w-[160px] font-semibold"
              onClick={() => {
                trackFunnelEvent('funnel_landing_cta_click', { intent: 'signup', surface: 'cta_banner' })
                router.push(PATHS.register)
              }}
            >
              {t('register')}
            </Button>
          ) : (
            <Button variant="primary" size="lg" className="min-w-[160px] font-semibold" onClick={() => router.push(PATHS.services)}>
              {t('browse_services')}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
