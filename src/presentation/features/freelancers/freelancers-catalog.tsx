'use client'

import '@/presentation/styles/route-catalog.css'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { FreelancerCard } from '@/presentation/components/features/freelancer-card'
import { Select } from '@/presentation/components/ui/select'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { MarketplaceTrustMetrics } from '@/presentation/components/layout/marketplace-trust-metrics'
import { CategoryIconRow } from '@/presentation/components/layout/category-icon-row'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { SearchDiscoveryHints } from '@/presentation/components/features/search-discovery-hints'
import { SkeletonFreelancerCard } from '@/presentation/components/ui/skeleton'
import { Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiProfilePublic } from '@/infrastructure/api/types'
import { freelancerPath, PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import type { TranslationKey } from '@/infrastructure/i18n'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'

interface FreelancersCatalogProps {
  hideHeader?: boolean
  titleKey?: TranslationKey
  subtitleKey?: TranslationKey
}

export function FreelancersCatalog({
  hideHeader = false,
  titleKey = 'nav_freelancers',
  subtitleKey = 'kwork_freelancers_sub',
}: FreelancersCatalogProps = {}) {
  const { t } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [freelancers, setFreelancers] = useState<ApiProfilePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const filterDrawerRef = useRef<HTMLDivElement>(null)
  const pageSize = 24

  useEscapeClose(filterOpen, () => setFilterOpen(false))
  useFocusTrap(filterOpen, filterDrawerRef)
  useBodyScrollLock(filterOpen)

  useEffect(() => {
    const q = searchParams.get('q')
    const reg = searchParams.get('region')
    if (q) setSearch(q)
    if (reg) setRegion(reg)
  }, [searchParams])

  useEffect(() => {
    setOffset(0)
  }, [search, region, specialty, sortBy])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      setLoadError(null)
      api
        .listFreelancers({
          q: search.trim() || undefined,
          region: region || undefined,
          specialty: specialty || undefined,
          sort: sortBy,
          limit: pageSize,
          offset,
        })
        .then((rows) => {
          setFreelancers((prev) => (offset === 0 ? rows : [...prev, ...rows]))
          setHasMore(rows.length >= pageSize)
        })
        .catch((e) => {
          if (offset === 0) setFreelancers([])
          setLoadError(e)
        })
        .finally(() => setLoading(false))
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, region, specialty, offset, sortBy, reloadTick])

  const filtered = freelancers
  const hasActiveFilters = search.trim() !== '' || region !== '' || specialty !== ''
  const activeFilterCount = [region, specialty].filter(Boolean).length

  const [suggestions, setSuggestions] = useState<ApiProfilePublic[]>([])

  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const id = setTimeout(() => {
      api
        .listFreelancers({ q, limit: 5, offset: 0, sort: sortBy })
        .then(setSuggestions)
        .catch((e) => {
          ignoreWithLog(e, { scope: 'catalog', apiPath: '/api/v1/profiles/freelancers' })
          setSuggestions([])
        })
    }, 300)
    return () => clearTimeout(id)
  }, [search, sortBy])

  const countLabel = t('catalog_results_freelancers').replace('{n}', String(filtered.length))

  const filterFields = (
    <>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('sort_by')}</span>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'newest')}
          options={[
            { value: 'rating', label: t('average_rating') },
            { value: 'reviews', label: t('stat_reviews') },
            { value: 'newest', label: t('sort_newest') },
          ]}
          wrapperClassName="min-w-0 flex-1"
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
        />
      </div>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('region')}</span>
        <Select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={[
            { value: '', label: t('hero_all_regions') },
            ...UZ_REGIONS.map((r) => ({ value: r, label: r })),
          ]}
          wrapperClassName="min-w-0 flex-1"
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
          aria-label={t('region')}
        />
      </div>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('specialty')}</span>
        <Select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          options={[
            { value: '', label: t('filter_all_categories') },
            ...KWORK_CATEGORY_ITEMS.map((item) => ({
              value: item.cat,
              label: t(item.labelKey),
            })),
          ]}
          wrapperClassName="min-w-0 flex-1"
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
          aria-label={t('specialty')}
        />
      </div>
    </>
  )

  const handleCategorySelect = (cat: string) => {
    setSpecialty((prev) => (prev === cat ? '' : cat))
  }

  return (
    <PageWrapper
      id={hideHeader ? 'freelancers-catalog' : undefined}
      className={hideHeader ? 'bg-[var(--ishbor-bg)] pt-4 md:pt-5' : 'bg-[var(--ishbor-bg)] pt-6 md:pt-8'}
    >
      {!hideHeader && (
        <div className="catalog-shell-head mb-5">
          <h1 className="catalog-shell-title">{t(titleKey)}</h1>
          <p className="catalog-shell-subtitle">{t(subtitleKey)}</p>
        </div>
      )}
      <div className="mb-5 space-y-3">
        <IshborProtectionStrip compact showLearnMore />
        <MarketplaceTrustMetrics compact />
      </div>

      <div className="catalog-shell-cats mb-4">
        <CategoryIconRow
          activeCategory={specialty || null}
          onCategorySelect={handleCategorySelect}
        />
      </div>

      <div className="mb-4">
        <div className="catalog-toolbar">
          <div className="catalog-toolbar-search relative">
            <div className="catalog-toolbar-search-field">
              <Search className="h-4 w-4" />
              <input
                type="text"
                className="ishbor-search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSuggestOpen(true)
                }}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                placeholder={t('kwork_search_freelancer')}
                aria-label={t('kwork_search_freelancer')}
              />
            </div>
            {suggestOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-[var(--ishbor-border)] bg-[var(--neutral-0)] shadow-[var(--shadow-md)]">
                {suggestions.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] hover:bg-[var(--color-primary-light)]"
                      onMouseDown={() => {
                        setSearch(f.full_name ?? '')
                        setSuggestOpen(false)
                        router.push(freelancerPath(f))
                      }}
                    >
                      {f.full_name ?? t('freelancer')}
                      {f.specialty ? (
                        <span className="ml-2 text-[11px] text-[var(--ishbor-text-muted)]">{f.specialty}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="catalog-toolbar-search-btn"
              aria-label={t('show_search_results')}
              onClick={() => document.getElementById('freelancer-results')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <div className="hide-mobile catalog-toolbar-actions">{filterFields}</div>

          <div className="show-mobile flex shrink-0 items-center gap-2">
            <div className="catalog-toolbar-sort min-w-[120px] flex-1">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'newest')}
                options={[
                  { value: 'rating', label: t('average_rating') },
                  { value: 'reviews', label: t('stat_reviews') },
                  { value: 'newest', label: t('sort_newest') },
                ]}
                aria-label={t('sort_by')}
              />
            </div>
            <Button
              variant="outline"
              size="md"
              className="catalog-toolbar-filter-btn shrink-0"
              onClick={() => setFilterOpen(true)}
              leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              aria-label={t('filter')}
            >
              {activeFilterCount > 0 ? (
                <Badge variant="primary" className="ml-0.5">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      <p id="freelancer-results" className="mb-4 min-h-[20px] px-0.5 text-[13px] text-[var(--ishbor-text-sub)]">
        {loading && offset === 0 ? (
          <span className="inline-block h-4 w-36 animate-pulse rounded-full bg-[var(--color-bg-muted)]" aria-label={t('loading_data')} />
        ) : (
          <span className="catalog-results-count-pill inline-flex">{countLabel}{hasMore ? '+' : ''}</span>
        )}
      </p>

      {loadError && offset === 0 ? (
        <LoadErrorAlert
          error={loadError}
          scope="catalog"
          onRetry={() => setReloadTick((n) => n + 1)}
          className="mb-4"
        />
      ) : loading && offset === 0 ? (
        <div className="freelancer-grid freelancer-grid--catalog">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonFreelancerCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-auto w-full max-w-lg">
          <EmptyState
            icon={<Users />}
            title={hasActiveFilters ? t('no_freelancers_filtered') : t('no_freelancers_yet')}
            description={hasActiveFilters ? t('no_freelancers_filtered_desc') : t('kwork_freelancers_sub')}
            action={
              hasActiveFilters
                ? {
                    label: t('clear_filters'),
                    onClick: () => {
                      setSearch('')
                      setRegion('')
                      setSpecialty('')
                    },
                  }
                : { label: t('browse_services'), onClick: () => router.push(PATHS.services) }
            }
            secondaryAction={
              hasActiveFilters
                ? undefined
                : { label: t('register'), onClick: () => router.push(PATHS.register), variant: 'outline' }
            }
          />
          {search.trim() ? <SearchDiscoveryHints query={search} /> : null}
        </div>
      ) : (
        <div className="freelancer-grid freelancer-grid--catalog">
          {filtered.map((f) => (
            <FreelancerCard
              key={f.id}
              name={f.full_name ?? t('freelancer')}
              specialty={f.specialty}
              region={f.region}
              rating={f.avg_rating}
              reviewCount={f.review_count}
              minPrice={f.hourly_rate && f.hourly_rate > 0 ? f.hourly_rate : undefined}
              variant="grid"
              isVerified={f.is_verified}
              trustScore={f.trust_score}
              onClick={() => router.push(freelancerPath(f))}
            />
          ))}
        </div>
      )}

      {hasMore && filtered.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            loading={loading && offset > 0}
            disabled={loading && offset > 0}
            onClick={() => setOffset((o) => o + pageSize)}
          >
            {t('show_more')}
          </Button>
        </div>
      )}

      {filterOpen && (
        <>
          <div className="drawer-backdrop show-mobile" onClick={() => setFilterOpen(false)} aria-hidden />
          <div
            ref={filterDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('filter')}
            className="drawer-panel show-mobile fixed inset-y-0 right-0 z-50 overflow-y-auto border-l border-[var(--ishbor-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[var(--ishbor-text)]">{t('filter')}</h2>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setFilterOpen(false)} aria-label={t('close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">{filterFields}</div>
            <Button variant="primary" className="mt-6 w-full" onClick={() => setFilterOpen(false)}>
              {t('show_search_results')}
            </Button>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
