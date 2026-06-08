'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
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
import { EscrowSteps } from '@/presentation/components/layout/escrow-steps'
import { PATHS } from '@/domain/constants/routes'
import type { ApiPublicStats } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import type { ApiPublicReview } from '@/infrastructure/api/types'

const HOW_STEPS: { num: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { num: '01', titleKey: 'how_step1_title', descKey: 'how_step1_desc' },
  { num: '02', titleKey: 'how_step2_title', descKey: 'how_step2_desc' },
  { num: '03', titleKey: 'how_step3_title', descKey: 'how_step3_desc' },
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
      <Rocket className="h-3.5 w-3.5" aria-hidden />
      {t('marketplace_tagline')}
    </span>
  )
}

export function LandingStatsRow({ stats }: { stats: ApiPublicStats }) {
  const { t } = useApp()
  const emptyLabel = t('stat_unavailable')
  const items = [
    { value: formatStat(stats.services, emptyLabel), label: t('landing_stat_services') },
    { value: formatStat(stats.freelancers, emptyLabel), label: t('landing_stat_freelancers') },
    { value: t('landing_stat_commission_value'), label: t('landing_stat_commission') },
  ]

  return (
    <div>
      <div className="landing-stats-row">
        {items.map((item, i) => (
          <div key={item.label} className="landing-stats-item">
            {i > 0 && <span className="landing-stats-divider hide-mobile" aria-hidden />}
            <p className="landing-stats-value">{item.value}</p>
            <p className="landing-stats-label">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--kwork-text-muted)]">{t('landing_stat_commission_note')}</p>
    </div>
  )
}

export function LandingHowItWorks() {
  const { t } = useApp()
  return (
    <section className="landing-how-section">
      <div className="layout-container max-w-[1280px]">
        <h2 className="landing-section-heading">{t('how_it_works_title')}</h2>
        <div className="landing-how-grid">
          {HOW_STEPS.map((step, i) => (
            <div key={step.num} className="landing-how-step">
              <div className="landing-how-step-circle">
                <span className="landing-how-step-num">{step.num}</span>
              </div>
              <h3 className="landing-how-step-title">{t(step.titleKey)}</h3>
              <p className="landing-how-step-desc">{t(step.descKey)}</p>
              {i < HOW_STEPS.length - 1 && (
                <ArrowRight className="landing-how-arrow hide-mobile" aria-hidden />
              )}
            </div>
          ))}
        </div>
        <EscrowSteps className="mt-10" />
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={PATHS.register}>
            <Button variant="primary" size="lg" className="landing-cta-btn min-w-[200px]">
              {t('start_now')}
            </Button>
          </Link>
          <Link href={PATHS.projects}>
            <Button variant="outline" size="lg" className="landing-cta-btn landing-cta-btn--outline min-w-[200px]">
              {t('cta_find_work')}
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
                  : t('services_count_zero')}
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

const FALLBACK_TESTIMONIAL_KEYS = [
  { quoteKey: 'landing_testimonial_1_quote' as TranslationKey, authorKey: 'landing_testimonial_1_author' as TranslationKey },
  { quoteKey: 'landing_testimonial_2_quote' as TranslationKey, authorKey: 'landing_testimonial_2_author' as TranslationKey },
  { quoteKey: 'landing_testimonial_3_quote' as TranslationKey, authorKey: 'landing_testimonial_3_author' as TranslationKey },
] as const

export function LandingTestimonials() {
  const { t } = useApp()
  const [items, setItems] = useState<TestimonialCard[]>([])
  const [ready, setReady] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

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
          setIsDemo(false)
        } else {
          setItems(
            FALLBACK_TESTIMONIAL_KEYS.map((k) => ({
              quote: t(k.quoteKey),
              author: t(k.authorKey),
              rating: 5,
            }))
          )
          setIsDemo(true)
        }
      })
      .catch(() => {
        setItems(
          FALLBACK_TESTIMONIAL_KEYS.map((k) => ({
            quote: t(k.quoteKey),
            author: t(k.authorKey),
            rating: 5,
          }))
        )
        setIsDemo(true)
      })
      .finally(() => setReady(true))
  }, [t])

  if (!ready) return null

  return (
    <section className="landing-testimonials-section">
      <div className="layout-container max-w-[1280px]">
        <h2 className="landing-section-heading">{t('clients_say')}</h2>
        {isDemo && (
          <p className="mb-4 text-center text-[12px] text-[var(--kwork-text-muted)]">{t('landing_testimonials_demo_note')}</p>
        )}
        <div className="landing-testimonials-grid">
          {items.map((item, idx) => (
            <article key={idx} className="landing-testimonial-card">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.round(item.rating)
                        ? 'fill-[var(--warning)] text-[var(--warning)]'
                        : 'fill-[var(--rating-empty)] text-[var(--rating-empty)]'
                    )}
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

export function LandingDarkTrust() {
  const { t } = useApp()
  return (
    <section className="landing-dark-trust">
      <div className="layout-container max-w-[1280px]">
        <h2 className="landing-dark-trust-title">{t('trust_section_title')}</h2>
        <ul className="landing-dark-trust-grid">
          {TRUST_ITEMS.map(({ icon: Icon, labelKey }) => (
            <li key={labelKey} className="landing-dark-trust-item">
              <span className="landing-dark-trust-icon">
                <Icon className="h-5 w-5" />
              </span>
              {labelKey === 'trust_item_support' || labelKey === 'trust_item_cert' ? (
                <Link href={PATHS.help} className="hover:text-[var(--color-primary)] hover:underline">
                  {t(labelKey)}
                </Link>
              ) : (
                <span>{t(labelKey)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function LandingCtaBanner() {
  const { t } = useApp()
  const router = useRouter()
  return (
    <section className="landing-cta-banner">
      <div className="layout-container max-w-[1280px]">
        <div className="landing-cta-banner-inner">
          <div>
            <h2 className="landing-cta-banner-title">{t('cta_banner_title')}</h2>
            <p className="landing-cta-banner-sub">{t('cta_banner_sub')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:shrink-0">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full bg-[var(--neutral-0)] font-bold text-[var(--color-primary)] hover:bg-[var(--brand-50)]"
              onClick={() => router.push(PATHS.register)}
            >
              {t('cta_be_freelancer')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-[color-mix(in_srgb,var(--neutral-0)_70%,transparent)] bg-transparent font-bold text-[var(--color-on-primary)] hover:border-[var(--neutral-0)] hover:bg-[color-mix(in_srgb,var(--neutral-0)_10%,transparent)]"
              onClick={() => router.push(PATHS.projects)}
            >
              {t('cta_find_work')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
