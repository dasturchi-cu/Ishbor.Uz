'use client'

import React, { useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Select } from '@/presentation/components/ui/select'
import { Badge } from '@/presentation/components/ui/badge'
import { SkeletonCard } from '@/presentation/components/ui/skeleton'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { CategoryIconRow } from '@/presentation/components/layout/category-icon-row'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { Search, X, SlidersHorizontal, ChevronDown, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchAutocomplete } from '@/presentation/components/layout/search-autocomplete'
import { api } from '@/infrastructure/api/client'
import type { ApiService } from '@/infrastructure/api/types'
import { servicePath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { useDelayedShow } from '@/shared/lib/use-delayed-show'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'
import { isServiceSaved, toggleSavedService } from '@/shared/lib/saved-items'
import {
  PriceRangeSlider,
  buildPriceHistogram,
} from '@/presentation/components/ui/price-range-slider'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'

type CatalogService = {
  id: string
  title: string
  description: string
  category: string
  freelancer: string
  price: number
  location: string
  rating: number
  reviewCount: number
  thumbnailUrl?: string
  deliveryDays?: number
}

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
}

function mapApiService(s: ApiService, freelancerFallback: string): CatalogService {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    freelancer: s.profiles?.full_name ?? freelancerFallback,
    price: s.price,
    location: s.region,
    rating: s.profiles?.avg_rating ?? 0,
    reviewCount: s.profiles?.review_count ?? 0,
    thumbnailUrl: s.image_urls?.[0],
    deliveryDays: s.delivery_days && s.delivery_days > 0 ? s.delivery_days : undefined,
  }
}

function roundCeiling(n: number): number {
  if (n <= 0) return 5_000_000
  const step = n > 10_000_000 ? 1_000_000 : 100_000
  return Math.ceil(n / step) * step
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

export function ServicesCatalog() {
  return (
    <Suspense fallback={<ServicesCatalogSkeleton />}>
      <ServicesCatalogContent />
    </Suspense>
  )
}

function ServicesCatalogSkeleton() {
  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-4 md:pt-5">
      <div className="catalog-shell">
        <div className="catalog-shell-cats">
          <div className="h-16 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
        </div>
        <div className="catalog-shell-body">
          <div className="hide-mobile catalog-sidebar">
            <div className="h-48 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
          </div>
          <div className="catalog-main">
            <div className="catalog-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

function ServicesCatalogContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { t, isLoggedIn } = useApp()
  const { authed } = useAuthReady()
  const router = useRouter()
  const [services, setServices] = useState<CatalogService[]>([])
  const [loading, setLoading] = useState(true)
  const showSkeleton = useDelayedShow(loading)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const filterDrawerRef = useRef<HTMLDivElement>(null)

  useEscapeClose(filterOpen, () => setFilterOpen(false))
  useFocusTrap(filterOpen, filterDrawerRef)
  useBodyScrollLock(filterOpen)

  useEffect(() => {
    const saved = localStorage.getItem('ishbor-catalog-view')
    if (saved === 'grid' || saved === 'list') setViewMode(saved)
  }, [])

  const handleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('ishbor-catalog-view', mode)
  }
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 9
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [experienceFilters, setExperienceFilters] = useState<string[]>([])
  const [priceCeiling, setPriceCeiling] = useState(5_000_000)
  const priceCeilingRef = useRef(5_000_000)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5_000_000])
  const [savedTick, setSavedTick] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [maxDeliveryDays, setMaxDeliveryDays] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: false,
    delivery: false,
    region: false,
    experience: false,
  })

  const DELIVERY_FILTER_OPTIONS = [0, 3, 7, 14, 30] as const

  useEffect(() => {
    const q = searchParams.get('q')
    const cat = searchParams.get('cat')
    if (q) {
      setSearchTerm(q)
      setDebouncedSearch(q)
    }
    if (cat) setSelectedCategory(cat)
  }, [searchParams])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(id)
  }, [searchTerm])

  useEffect(() => {
    if (!authed || !debouncedSearch) return
    api.trackAnalytics('search', { query: debouncedSearch, surface: 'services' }).catch(() => undefined)
  }, [authed, debouncedSearch])

  const handleCategorySelect = useCallback(
    (cat: string) => {
      setSelectedCategory(cat)
      const params = new URLSearchParams(searchParams.toString())
      if (cat === 'all') params.delete('cat')
      else params.set('cat', cat)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const [minPrice, maxPrice] = priceRange

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    api
      .listServices({
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        region: selectedRegion || undefined,
        sort: sortBy,
        min_price: minPrice > 0 ? minPrice : undefined,
        max_price: maxPrice < priceCeilingRef.current ? maxPrice : undefined,
        max_delivery_days: maxDeliveryDays > 0 ? maxDeliveryDays : undefined,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      })
      .then((data) => {
        const mapped = data.items.map((s) => mapApiService(s, t('freelancer')))
        setServices(mapped)
        setTotalCount(data.total)
        setHasMore(currentPage * PAGE_SIZE < data.total)
        const top = mapped.reduce((acc, s) => Math.max(acc, s.price), 0)
        const ceiling = roundCeiling(top)
        priceCeilingRef.current = ceiling
        setPriceCeiling(ceiling)
        setPriceRange(([low, high]) => [
          Math.min(low, ceiling),
          high > ceiling || high === 5_000_000 ? ceiling : Math.min(high, ceiling),
        ])
      })
      .catch(() => {
        setServices([])
        setHasMore(false)
        setTotalCount(0)
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, selectedCategory, selectedRegion, currentPage, sortBy, minPrice, maxPrice, maxDeliveryDays, reloadTick, t])

  const categories = [
    { id: 'all', label: t('cat_all') },
    { id: 'web', label: t('cat_web') },
    { id: 'mobile', label: t('cat_mobile') },
    { id: 'uiux', label: t('cat_uiux') },
    { id: 'graphic', label: t('cat_graphic') },
    { id: 'writing', label: t('cat_writing') },
    { id: 'video', label: t('cat_video') },
    { id: 'seo', label: t('cat_seo') },
    { id: 'smm', label: t('kwork_cat_smm') },
    { id: 'design', label: t('kwork_cat_business') },
  ]

  const priceFilterActive = minPrice > 0 || maxPrice < priceCeiling
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    debouncedSearch !== '' ||
    priceFilterActive ||
    maxDeliveryDays > 0 ||
    selectedRegion !== '' ||
    experienceFilters.length > 0

  const activeFilterCount = [
    selectedCategory !== 'all',
    debouncedSearch !== '',
    priceFilterActive,
    maxDeliveryDays > 0,
    selectedRegion !== '',
    experienceFilters.length > 0,
  ].filter(Boolean).length

  const priceHistogram = useMemo(
    () => buildPriceHistogram(services.map((s) => s.price), 0, priceCeiling),
    [services, priceCeiling]
  )

  const filteredServices = useMemo(() => {
    let result = services

    if (sortBy === 'rating') {
      result = [...result].sort(
        (a, b) =>
          b.rating - a.rating ||
          b.reviewCount - a.reviewCount ||
          a.price - b.price
      )
    }

    if (experienceFilters.length === 0) return result

    return result.filter((service) => {
      const rating = service.rating
      const checks: boolean[] = []
      if (experienceFilters.includes('exp_new')) checks.push(rating < 4 || rating === 0)
      if (experienceFilters.includes('exp_mid')) checks.push(rating >= 4 && rating < 4.7)
      if (experienceFilters.includes('exp_expert')) checks.push(rating >= 4.7)
      return checks.some(Boolean)
    })
  }, [services, experienceFilters, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedCategory, selectedRegion, minPrice, maxPrice, maxDeliveryDays, sortBy, viewMode])

  const paginatedServices = filteredServices

  const resetFilters = useCallback(() => {
    setSelectedCategory('all')
    setSearchTerm('')
    setDebouncedSearch('')
    setSortBy('popular')
    setSelectedRegion('')
    setExperienceFilters([])
    setMaxDeliveryDays(0)
    setPriceRange([0, priceCeiling])
    router.replace(pathname, { scroll: false })
  }, [pathname, priceCeiling, router])

  const categoryLabel = (id: string) => {
    const key = CATEGORY_KEYS[id]
    return key ? t(key) : id
  }

  const resultCount = experienceFilters.length > 0 ? filteredServices.length : totalCount
  const servicesFoundParts = t('services_found')
    .replace('{n}', String(resultCount))
    .split(String(resultCount))

  const activeCategoryForIcons = selectedCategory === 'all' ? null : selectedCategory
  const lowLiquidity = !hasActiveFilters && totalCount > 0 && totalCount < 8

  useEffect(() => {
    if (lowLiquidity && sortBy === 'popular') {
      setSortBy('newest')
    }
  }, [lowLiquidity, sortBy])

  const filterSidebar = (
    <div className="catalog-filter-panel">
      <div className="catalog-filter-head">
        <h2 className="catalog-filter-title">{t('filters')}</h2>
        {hasActiveFilters && (
          <button type="button" onClick={resetFilters} className="catalog-filter-clear">
            {t('clear_filters')}
          </button>
        )}
      </div>

      <FilterSection
        title={t('category')}
        open={expandedSections.category}
        onToggle={() => setExpandedSections((s) => ({ ...s, category: !s.category }))}
      >
        <div className="catalog-filter-options">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={cn(
                'catalog-filter-option',
                selectedCategory === cat.id && 'catalog-filter-option--active'
              )}
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.id}
                onChange={() => handleCategorySelect(cat.id)}
              />
              {cat.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title={t('price_range')}
        open={expandedSections.price}
        onToggle={() => setExpandedSections((s) => ({ ...s, price: !s.price }))}
      >
        <PriceRangeSlider
          min={0}
          max={priceCeiling}
          values={priceRange}
          onChange={setPriceRange}
          histogram={priceHistogram}
          fromLabel={t('service_from')}
          toLabel={t('price_to')}
        />
      </FilterSection>

      <FilterSection
        title={t('filter_delivery')}
        open={expandedSections.delivery}
        onToggle={() => setExpandedSections((s) => ({ ...s, delivery: !s.delivery }))}
      >
        <div className="catalog-filter-options">
          {DELIVERY_FILTER_OPTIONS.map((days) => (
            <label
              key={days}
              className={cn(
                'catalog-filter-option',
                maxDeliveryDays === days && 'catalog-filter-option--active'
              )}
            >
              <input
                type="radio"
                name="delivery"
                checked={maxDeliveryDays === days}
                onChange={() => setMaxDeliveryDays(days)}
              />
              {days === 0
                ? t('filter_delivery_all')
                : t('filter_delivery_within').replace('{n}', String(days))}
            </label>
          ))}
        </div>
      </FilterSection>

      {!lowLiquidity && (
        <>
          <FilterSection
            title={t('filter_region')}
            open={expandedSections.region}
            onToggle={() => setExpandedSections((s) => ({ ...s, region: !s.region }))}
          >
            <div className="catalog-filter-select-wrap">
              <Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                options={[{ value: '', label: t('cat_all') }, ...UZ_REGIONS.map((r) => ({ value: r, label: r }))]}
                className="catalog-filter-select"
              />
            </div>
          </FilterSection>

          <FilterSection
            title={t('filter_level')}
            open={expandedSections.experience}
            onToggle={() => setExpandedSections((s) => ({ ...s, experience: !s.experience }))}
          >
            <p className="mb-2 text-[11px] leading-relaxed text-[var(--ishbor-text-muted)]">
              {t('filter_level_rating_hint')}
            </p>
            <div className="catalog-filter-options">
              {(['exp_new', 'exp_mid', 'exp_expert'] as const).map((key) => (
                <label
                  key={key}
                  className={cn(
                    'catalog-filter-option catalog-filter-option--check',
                    experienceFilters.includes(key) && 'catalog-filter-option--active'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={experienceFilters.includes(key)}
                    onChange={(e) => {
                      setExperienceFilters((prev) =>
                        e.target.checked ? [...prev, key] : prev.filter((k) => k !== key)
                      )
                    }}
                  />
                  {t(key)}
                </label>
              ))}
            </div>
          </FilterSection>
        </>
      )}
    </div>
  )

  return (
    <PageWrapper
      className="bg-[var(--ishbor-bg)] pt-6 md:pt-8"
      breadcrumb={[
        { label: t('home'), href: PATHS.home },
        { label: t('nav_services') },
      ]}
    >
      <div className="catalog-shell">
        <div className="catalog-shell-head">
          <h1 className="catalog-shell-title">{t('nav_services')}</h1>
        </div>

        <div className="catalog-shell-cats">
          <CategoryIconRow
            activeCategory={activeCategoryForIcons}
            onCategorySelect={handleCategorySelect}
          />
        </div>

        <div className="catalog-shell-body">
          <div className="hide-mobile catalog-sidebar">{filterSidebar}</div>

          <div className="catalog-main">
            <div className="catalog-toolbar-row">
              <div className="catalog-toolbar-search-wrap">
                <SearchAutocomplete
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSubmit={() => setDebouncedSearch(searchTerm.trim())}
                  placeholder={t('search_services')}
                  className="w-full"
                  variant="catalog"
                />
              </div>

              <div className="catalog-toolbar-controls">
                {isLoggedIn && debouncedSearch ? (
                  <p className="catalog-results-query">
                    {t('search_services')}: <strong>{debouncedSearch}</strong>
                  </p>
                ) : (
                  <span className="catalog-results-count-pill">
                    {loading ? (
                      t('loading_data')
                    ) : (
                      <>
                        {servicesFoundParts[0]}
                        <strong>{filteredServices.length}</strong>
                        {servicesFoundParts[1] ?? ''}
                      </>
                    )}
                  </span>
                )}

                <div className="catalog-view-toggle">
                  <button
                    type="button"
                    className={cn('catalog-view-btn', viewMode === 'grid' && 'catalog-view-btn--active')}
                    onClick={() => handleViewMode('grid')}
                    aria-label={t('catalog_view_grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn('catalog-view-btn', viewMode === 'list' && 'catalog-view-btn--active')}
                    onClick={() => handleViewMode('list')}
                    aria-label={t('catalog_view_list')}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <div className="catalog-toolbar-sort">
                  <span className="catalog-toolbar-sort-label">{t('sort_label')}</span>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                      { value: 'popular', label: t('sort_popular') },
                      { value: 'newest', label: t('sort_newest') },
                      { value: 'rating', label: t('sort_rating') },
                      { value: 'delivery-fast', label: t('sort_delivery_fast') },
                      { value: 'price-low', label: t('sort_price_asc') },
                      { value: 'price-high', label: t('sort_price_desc') },
                    ]}
                    wrapperClassName="catalog-toolbar-sort__select"
                    className="catalog-toolbar-sort__native"
                  />
                </div>

                <Button
                  variant="outline"
                  size="md"
                  className="show-mobile catalog-toolbar-filter-btn"
                  onClick={() => setFilterOpen(true)}
                  leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                >
                  {t('filter')}
                  {activeFilterCount > 0 && (
                    <Badge variant="primary" className="ml-0.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <IshborProtectionStrip compact className="mb-4" />

            {hasActiveFilters && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedCategory !== 'all' && (
                  <FilterChip
                    label={categoryLabel(selectedCategory)}
                    onRemove={() => handleCategorySelect('all')}
                  />
                )}
                {debouncedSearch && (
                  <FilterChip label={debouncedSearch} onRemove={() => { setSearchTerm(''); setDebouncedSearch('') }} />
                )}
                {minPrice > 0 && (
                  <FilterChip
                    label={`≥ ${formatPrice(minPrice)}`}
                    onRemove={() => setPriceRange(([_, high]) => [0, high])}
                  />
                )}
                {maxPrice < priceCeiling && (
                  <FilterChip
                    label={`≤ ${formatPrice(maxPrice)}`}
                    onRemove={() => setPriceRange(([low]) => [low, priceCeiling])}
                  />
                )}
                {maxDeliveryDays > 0 && (
                  <FilterChip
                    label={t('filter_delivery_within').replace('{n}', String(maxDeliveryDays))}
                    onRemove={() => setMaxDeliveryDays(0)}
                  />
                )}
              </div>
            )}

            {loadError ? (
              <EmptyState
                icon={<Search />}
                title={t('catalog_load_error')}
                action={{
                  label: t('catalog_retry'),
                  onClick: () => setReloadTick((n) => n + 1),
                }}
              />
            ) : loading && !showSkeleton ? null : loading ? (
              <div className="catalog-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title={hasActiveFilters ? t('no_services_found') : t('catalog_empty_discovery_title')}
                description={hasActiveFilters ? t('no_services_desc') : t('catalog_empty_discovery_desc')}
                action={
                  hasActiveFilters
                    ? { label: t('clear_filters'), onClick: resetFilters }
                    : { label: t('browse_services'), onClick: () => router.push(PATHS.services) }
                }
                secondaryAction={
                  hasActiveFilters
                    ? { label: t('catalog_empty_browse_freelancers'), onClick: () => router.push(PATHS.freelancers) }
                    : { label: t('catalog_empty_post_project'), onClick: () => router.push(PATHS.postProject), variant: 'outline' }
                }
              />
            ) : (
              <>
                <div className={cn(viewMode === 'grid' ? 'catalog-grid' : 'catalog-list')}>
                  {paginatedServices.map((service, index) => (
                    <ServiceCard
                      key={`${service.id}-${savedTick}`}
                      imagePriority={index < 4}
                      title={service.title}
                      sellerName={service.freelancer}
                      sellerInitials={initials(service.freelancer)}
                      rating={service.rating}
                      reviewCount={service.reviewCount}
                      price={service.price}
                      category={service.category}
                      thumbnailUrl={service.thumbnailUrl}
                      deliveryDays={service.deliveryDays}
                      description={viewMode === 'list' ? service.description : undefined}
                      view={viewMode === 'list' ? 'list' : 'kwork'}
                      isSaved={isServiceSaved(service.id)}
                      onSave={() => {
                        void toggleSavedService(service.id).then(() => setSavedTick((n) => n + 1))
                      }}
                      onClick={() => router.push(servicePath(service.id))}
                    />
                  ))}
                </div>
                {(currentPage > 1 || hasMore) && (
                  <nav
                    className="show-mobile mt-4 flex items-center justify-center gap-3"
                    aria-label={t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', '…')}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                      {t('back')}
                    </Button>
                    <span className="text-[13px] text-[var(--ishbor-text-muted)]">
                      {t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', String(totalPages))}
                    </span>
                    {hasMore ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                      >
                        {t('continue')}
                      </Button>
                    ) : (
                      <span className="w-[72px]" aria-hidden />
                    )}
                  </nav>
                )}
                {(currentPage > 1 || hasMore) && (
                  <nav className="catalog-pagination hide-mobile" aria-label={t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', '…')}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                      {t('back')}
                    </Button>
                    <span className="catalog-pagination-label">
                      {t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', String(totalPages))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      {t('continue')}
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {filterOpen && (
        <>
          <div
            className="drawer-backdrop show-mobile backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
            aria-hidden
          />
          <div
            ref={filterDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('filters')}
            className="drawer-panel show-mobile fixed inset-y-0 right-0 z-50 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t('filters')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setFilterOpen(false)} aria-label={t('close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {filterSidebar}
            <Button variant="primary" fullWidth className="mt-6" onClick={() => setFilterOpen(false)}>
              {t('continue')}
            </Button>
          </div>
        </>
      )}
    </PageWrapper>
  )
}

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={cn('catalog-filter-section', open && 'catalog-filter-section--open')}>
      <button type="button" onClick={onToggle} className="catalog-filter-section-btn" aria-expanded={open}>
        <span>{title}</span>
        <span className="catalog-filter-section-chevron">
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && <div className="catalog-filter-section__body">{children}</div>}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useApp()
  return (
    <span className="filter-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={t('remove_filter')}>
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
