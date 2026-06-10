'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { FreelancerCard } from '@/presentation/components/features/freelancer-card'
import { Select } from '@/presentation/components/ui/select'
import { Button } from '@/presentation/components/ui/button'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Search, Users } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiProfilePublic } from '@/infrastructure/api/types'
import { freelancerPath } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

interface FreelancersCatalogProps {
  titleKey?: TranslationKey
  subtitleKey?: TranslationKey
}

export function FreelancersCatalog({
  titleKey = 'nav_freelancers',
  subtitleKey = 'kwork_freelancers_sub',
}: FreelancersCatalogProps = {}) {
  const { t } = useApp()
  const router = useRouter()
  const [freelancers, setFreelancers] = useState<ApiProfilePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const pageSize = 24

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reg = params.get('region')
    if (reg) setRegion(reg)
  }, [])

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

  const countLabel = loading
    ? t('loading_data')
    : `${filtered.length} ${t('stats_freelancers').toLowerCase()}`

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">
      <div className="surface-panel mb-4 px-4 py-3.5 sm:px-5 sm:py-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--ishbor-text)] sm:text-[22px]">
          {t(titleKey)}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ishbor-text-muted)] sm:text-[14px]">
          {t(subtitleKey)}
        </p>
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

          <div className="catalog-toolbar-actions">
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
          </div>
        </div>
      </div>

      <p id="freelancer-results" className="mb-4 px-0.5 text-[13px] text-[var(--ishbor-text-muted)]">{countLabel}</p>

      {loadError && offset === 0 ? (
        <LoadErrorAlert
          error={loadError}
          scope="catalog"
          onRetry={() => setReloadTick((n) => n + 1)}
          className="mb-4"
        />
      ) : loading && offset === 0 ? (
        <div className="freelancer-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ishbor-card h-36 animate-pulse bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={hasActiveFilters ? t('no_freelancers_filtered') : t('no_freelancers_yet')}
          description={hasActiveFilters ? t('no_services_desc') : t('kwork_freelancers_sub')}
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
      ) : (
        <div className="freelancer-grid">
          {filtered.map((f) => (
            <FreelancerCard
              key={f.id}
              name={f.full_name ?? t('freelancer')}
              specialty={f.specialty}
              region={f.region}
              rating={f.avg_rating}
              reviewCount={f.review_count}
              variant="row"
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
    </PageWrapper>
  )
}
