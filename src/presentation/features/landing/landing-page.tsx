'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Search, Star } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { SkeletonCard } from '@/presentation/components/ui/skeleton'
import { freelancerPath, PATHS, servicePath } from '@/domain/constants/routes'
import { fetchPublicStatsCached } from '@/shared/lib/public-stats-cache'
import type { ApiPublicStats } from '@/infrastructure/api/types'
import { initialsFromName } from '@/shared/lib/avatar'
import { cn } from '@/shared/lib/utils'
import { MarketplacePulse } from '@/presentation/components/layout/marketplace-pulse'
import { SearchAutocomplete } from '@/presentation/components/layout/search-autocomplete'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Avatar } from '@/presentation/components/ui/avatar'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import {
  LandingCategoryGrid,
  LandingFeaturedTabs,
  LandingHowItWorks,
  LandingTestimonials,
  LandingTopFreelancers,
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

export function LandingPage() {
  const { t, isLoggedIn, isAuthLoading, profile } = useApp()
  const router = useRouter()
  const [stats, setStats] = useState<ApiPublicStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [statsLoadError, setStatsLoadError] = useState<unknown>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredTab, setFeaturedTab] = useState('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { hash, search } = window.location
      if (hash.includes('type=recovery') || search.includes('type=recovery')) return
    }
    if (isAuthLoading || !isLoggedIn || !profile) return
    if (!profile.onboarding_completed && !profile.is_admin) {
      router.replace(PATHS.onboarding)
    }
  }, [isAuthLoading, isLoggedIn, profile, router])

  const loadStats = useCallback(() => {
    setLoading(true)
    setStatsLoadError(null)
    fetchPublicStatsCached()
      .then((data) => {
        setStats(data)
        setStatsLoadError(null)
      })
      .catch((e) => {
        setStats(EMPTY_STATS)
        setStatsLoadError(e)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

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

  return (
    <div className="landing-page min-h-screen bg-[var(--body-bg)]">
      {statsLoadError ? (
        <div className="layout-container max-w-[1280px] pt-4">
          <LoadErrorAlert
            error={statsLoadError}
            scope="landing"
            onRetry={loadStats}
            context={{ apiPath: '/api/v1/stats/public' }}
          />
        </div>
      ) : null}
      <section className="ishbor-landing-hero">
        <div className="layout-container landing-hero-content max-w-[1280px] py-[var(--landing-hero-pad)]">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,340px)] lg:gap-12">
            <div className="min-w-0">
              <h1 className="landing-hero-title text-[length:var(--text-h2)] font-bold leading-[1.1] tracking-tight sm:text-[length:var(--text-h1)] lg:text-[length:var(--text-display)] lg:leading-[1.06]">
                {t('kwork_hero_headline')}
              </h1>
              <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-[var(--ishbor-text-muted)] sm:text-[16px]">
                {t('landing_hero_sub')}
              </p>

              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                placeholder={t('hero_search_placeholder')}
                className="mt-6 max-w-[560px]"
                variant="hero"
              />

              <MarketplacePulse stats={stats} className="mt-4" />
            </div>

            {showFeaturedCard && featured && (
              <Link
                href={freelancerPath(featured)}
                className="landing-hero-spotlight relative mx-auto hidden w-full max-w-[340px] transition hover:opacity-[0.98] lg:block"
              >
                <div className="landing-hero-spotlight-inner">
                  <div className="ishbor-hero-visual">
                    <Avatar name={featuredName ?? t('freelancer')} size={120} />
                  </div>
                </div>
                <div className="ishbor-hero-badge">
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
                  <p className="mt-1 text-[13px] font-semibold text-[var(--ishbor-text)]">
                    {featuredName}, {featuredRole}
                  </p>
                  {featuredRating != null && featuredRating > 0 && (
                    <p className="text-[12px] text-[var(--ishbor-text-muted)]">
                      {featuredRating.toFixed(1)} · {t('nav_freelancers')}
                    </p>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <LandingCategoryGrid stats={stats} />

      <section className="landing-featured-section page-section">
        <div className="layout-container max-w-[1280px]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="ishbor-section-title mb-0">{t('kwork_popular_services')}</h2>
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
            <div className="ishbor-grid mt-5">
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
            />
          ) : (
            <div className="ishbor-grid mt-5">
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
      </section>

      <LandingTopFreelancers stats={stats} />

      <LandingTestimonials />

      <LandingHowItWorks />
    </div>
  )
}
