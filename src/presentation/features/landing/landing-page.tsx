'use client'



import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { Briefcase, ChevronRight, Search, Star, Users, X } from 'lucide-react'

import { useApp } from '@/application/providers/app-provider'

import { ServiceCard } from '@/presentation/components/features/service-card'

import { SkeletonCard } from '@/presentation/components/ui/skeleton'

import { PATHS, servicePath, defaultAuthDestination } from '@/domain/constants/routes'

import { fetchPublicStatsCached } from '@/shared/lib/public-stats-cache'

import type { ApiPublicStats } from '@/infrastructure/api/types'

import type { TranslationKey } from '@/infrastructure/i18n'

import { initialsFromName } from '@/shared/lib/avatar'
import { cn } from '@/shared/lib/utils'

import { TrustStrip } from '@/presentation/components/layout/trust-strip'
import { TrustBrandLogos } from '@/presentation/components/layout/trust-brand-logos'
import { SearchAutocomplete } from '@/presentation/components/layout/search-autocomplete'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'

import {

  LandingCategoryGrid,

  LandingCtaBanner,

  LandingDarkTrust,

  LandingFeaturedTabs,

  LandingHeroBadge,

  LandingHowItWorks,

  LandingStatsRow,

  LandingTestimonials,

  filterServicesByTab,

} from '@/presentation/features/landing/landing-sections'



const EMPTY_STATS: ApiPublicStats = {

  freelancers: 0,

  clients: 0,

  projects: 0,

  services: 0,

  avg_rating: 0,

  review_count: 0,

  category_counts: {},

  top_services: [],

  featured_freelancers: [],

}



const POPULAR_TAGS: { key: TranslationKey; cat: string }[] = [

  { key: 'mega_sub_uiux', cat: 'uiux' },

  { key: 'mega_sub_logo', cat: 'graphic' },

  { key: 'mega_sub_social_design', cat: 'graphic' },

  { key: 'mega_sub_wordpress', cat: 'web' },

]



const PROMO_KEY = 'ishbor-promo-dismissed'



function PromoBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useApp()

  return (
    <div className="kwork-promo-banner">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-white sm:text-[14px]">
          {t('first_order_promo')}
          <span className="hidden sm:inline"> · {t('landing_stat_commission_note')}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={PATHS.services}
            className="rounded-md bg-white px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--brand-50)]"
          >
            {t('browse_services')}
          </Link>

          <button

            type="button"

            onClick={onDismiss}

            className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"

            aria-label={t('close')}

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      </div>

    </div>

  )

}



export function LandingPage() {

  const { t, isLoggedIn, isAuthLoading, currentUserRole, profile } = useApp()

  const router = useRouter()

  const [stats, setStats] = useState<ApiPublicStats>(EMPTY_STATS)

  const [loading, setLoading] = useState(true)
  const [statsUnavailable, setStatsUnavailable] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [promoVisible, setPromoVisible] = useState(false)

  const [featuredTab, setFeaturedTab] = useState('all')



  useEffect(() => {

    if (typeof window !== 'undefined' && !localStorage.getItem(PROMO_KEY)) {

      setPromoVisible(true)

    }

  }, [])



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { hash, search } = window.location
      if (hash.includes('type=recovery') || search.includes('type=recovery')) return
    }
    if (isAuthLoading || !isLoggedIn) return
    if (!profile) return
    const dest =
      !profile.onboarding_completed && !profile.is_admin
        ? PATHS.onboarding
        : defaultAuthDestination(profile, currentUserRole)
    router.replace(dest)
  }, [isAuthLoading, isLoggedIn, currentUserRole, profile, router])



  useEffect(() => {

    fetchPublicStatsCached()

      .then(setStats)

      .catch(() => {
        setStats(EMPTY_STATS)
        setStatsUnavailable(true)
      })

      .finally(() => setLoading(false))

  }, [])



  const filteredServices = useMemo(
    () => {
      const allServices = stats.top_services.length > 0 ? stats.top_services : []
      return filterServicesByTab(allServices, featuredTab)
    },
    [stats.top_services, featuredTab],
  )



  const featured = stats.featured_freelancers[0]
  const featuredName = featured?.full_name
  const featuredRole = featured?.specialty ?? t('landing_featured_role')
  const featuredRating = featured?.avg_rating
  const showFeaturedCard = Boolean(featuredName)



  const handleSearch = (e?: React.FormEvent) => {

    e?.preventDefault()

    const q = searchQuery.trim()

    router.push(q ? `${PATHS.services}?q=${encodeURIComponent(q)}` : PATHS.services)

  }



  const dismissPromo = () => {

    localStorage.setItem(PROMO_KEY, '1')

    setPromoVisible(false)

  }



  if (isAuthLoading || isLoggedIn) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[var(--body-bg)]"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--kwork-border)] border-t-[var(--color-primary)]" />
        <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('landing_redirecting')}</p>
      </div>
    )
  }



  return (

    <div className="landing-page min-h-screen bg-[var(--body-bg)]">

      {promoVisible && <PromoBanner onDismiss={dismissPromo} />}



      <section className="kwork-landing-hero">

        <div className="layout-container landing-hero-content max-w-[1280px] py-[var(--landing-hero-pad)]">

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,380px)] lg:gap-14">

            <div className="min-w-0">

              <LandingHeroBadge />



              <h1 className="landing-hero-title mt-5 text-[length:var(--text-h2)] font-bold leading-[1.1] tracking-tight sm:text-[length:var(--text-h1)] lg:text-[length:var(--text-display)] lg:leading-[1.06]">

                {t('kwork_hero_headline')}

              </h1>

              <p className="mt-5 max-w-[540px] text-[15px] leading-relaxed text-[var(--kwork-text-muted)] sm:text-[17px]">

                {t('kwork_hero_sub')}

              </p>



              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                placeholder={t('hero_search_placeholder')}
                className="mt-7 max-w-[580px]"
                variant="hero"
              />

              <div className="landing-hero-actions mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-7 font-bold shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  onClick={handleSearch}
                >
                  {t('browse_services')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-[var(--kwork-border)] bg-[color-mix(in_srgb,var(--neutral-0)_85%,transparent)] px-7 font-bold backdrop-blur-sm"
                  onClick={() => router.push(PATHS.register)}
                >
                  {t('start_now')}
                </Button>
              </div>

              <div className="landing-hero-shortcuts">
                <Link href={PATHS.services} className="landing-hero-shortcut">
                  <Search className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                  {t('nav_services')}
                </Link>
                <Link href={PATHS.freelancers} className="landing-hero-shortcut">
                  <Users className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                  {t('nav_freelancers')}
                </Link>
                <Link href={PATHS.projects} className="landing-hero-shortcut">
                  <Briefcase className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                  {t('nav_projects')}
                </Link>
              </div>



              <TrustStrip className="mt-7" />



              <div className="mt-6 flex flex-wrap items-center gap-2">

                <span className="text-[13px] font-medium text-[var(--kwork-text-muted)]">

                  {t('hero_popular')}:

                </span>

                {POPULAR_TAGS.map(({ key, cat }) => (

                  <button

                    key={key}

                    type="button"

                    onClick={() => router.push(`${PATHS.services}?cat=${cat}`)}

                    className="kwork-landing-tag"

                  >

                    <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />

                    {t(key)}

                  </button>

                ))}

              </div>

            </div>



            {showFeaturedCard && (
              <div className="landing-hero-spotlight relative mx-auto w-full max-w-[380px] lg:mx-0">
                <div className="landing-hero-spotlight-inner">
                  <div className="kwork-hero-visual">
                    <Avatar name={featuredName ?? t('freelancer')} size={120} />
                  </div>
                </div>
                <div className="kwork-hero-badge">
                  {featuredRating != null && featuredRating > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i < Math.round(featuredRating)
                              ? 'fill-[var(--rating-filled)] text-[var(--rating-filled)]'
                              : 'fill-[var(--rating-empty)] text-[var(--rating-empty)]'
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[13px] font-semibold text-[var(--kwork-text)]">
                    {featuredName}, {featuredRole}
                  </p>
                  {featuredRating != null && featuredRating > 0 && (
                    <p className="text-[12px] text-[var(--kwork-text-muted)]">
                      {featuredRating.toFixed(1)} · {t('nav_freelancers')}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>



          <LandingStatsRow stats={stats} />
          {statsUnavailable && (
            <p className="mt-2 text-center text-[11px] text-[var(--kwork-text-muted)]">{t('landing_stats_unavailable')}</p>
          )}

        </div>

      </section>



      <section className="border-y border-[var(--kwork-border)] bg-[var(--neutral-0)] py-5">
        <TrustBrandLogos className="layout-container max-w-[1280px]" />
      </section>



      <LandingCategoryGrid stats={stats} />



      <section className="landing-featured-section page-section">

        <div className="layout-container max-w-[1280px]">

          <div className="surface-panel rounded-2xl border border-[var(--kwork-border)] p-5 shadow-[var(--shadow-card)] sm:p-7">

            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <h2 className="kwork-section-title mb-0">{t('kwork_popular_services')}</h2>

              <Link

                href={PATHS.services}

                className="flex items-center gap-0.5 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"

              >

                {t('view_all')}

                <ChevronRight className="h-4 w-4" />

              </Link>

            </div>



            <LandingFeaturedTabs activeTab={featuredTab} onTabChange={setFeaturedTab} />



            {loading ? (

              <div className="kwork-grid mt-5">

                {Array.from({ length: 8 }).map((_, i) => (

                  <SkeletonCard key={i} />

                ))}

              </div>

            ) : filteredServices.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title={t('no_services_yet')}
                description={t('no_services_dashboard_desc')}
                action={{ label: t('browse_services'), onClick: () => router.push(PATHS.services) }}
                secondaryAction={{ label: t('register'), onClick: () => router.push(PATHS.register), variant: 'outline' }}
              />
            ) : (

              <div className="kwork-grid mt-5">

                {filteredServices.slice(0, 8).map((svc) => (

                  <ServiceCard

                    key={svc.id}

                    title={svc.title}

                    sellerName={(svc.profiles as { full_name?: string } | null)?.full_name ?? t('freelancer')}

                    sellerInitials={initialsFromName(

                      (svc.profiles as { full_name?: string } | null)?.full_name ?? 'F'

                    )}

                    rating={(svc.profiles as { avg_rating?: number } | null)?.avg_rating ?? 0}
                    reviewCount={(svc.profiles as { review_count?: number } | null)?.review_count ?? 0}

                    price={svc.price}

                    category={svc.category}

                    onClick={() => router.push(servicePath(svc.id))}

                  />

                ))}

              </div>

            )}

          </div>

        </div>

      </section>



      <LandingHowItWorks />

      <LandingTestimonials />

      <LandingDarkTrust />

      <LandingCtaBanner />

      <div className="mobile-sticky-cta show-mobile">
        <p className="min-w-0 flex-1 text-[13px] font-medium text-[var(--kwork-text)]">{t('kwork_hero_headline')}</p>
        <Button
          variant="primary"
          size="md"
          className="shrink-0 !w-auto px-5"
          onClick={() => router.push(PATHS.register)}
        >
          {t('register')}
        </Button>
      </div>

    </div>

  )

}

