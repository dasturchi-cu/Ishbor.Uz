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
    <PageWrapper className="bg-[var(--kwork-bg)] pt-4 md:pt-5">
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
  const PAGE_SIZE = 9

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [experienceFilters, setExperienceFilters] = useState<string[]>([])
  const [priceCeiling, setPriceCeiling] = useState(5_000_000)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5_000_000])
  const [savedTick, setSavedTick] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    region: true,
    experience: true,
  })

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

  useEffect(() => {
    setLoading(true)
    api
      .listServices({
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        region: selectedRegion || undefined,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      })
      .then((data) => {
        const mapped = data.map((s) => mapApiService(s, t('freelancer')))
        setServices(mapped)
        setHasMore(data.length === PAGE_SIZE)
        const top = mapped.reduce((acc, s) => Math.max(acc, s.price), 0)
        const ceiling = roundCeiling(top)
        setPriceCeiling(ceiling)
        setPriceRange(([low, high]) => [
          Math.min(low, ceiling),
          high > ceiling || high === 5_000_000 ? ceiling : Math.min(high, ceiling),
        ])
      })
      .catch(() => {
        setServices([])
        setHasMore(false)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, selectedCategory, selectedRegion, currentPage, t])

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

  const [minPrice, maxPrice] = priceRange
  const priceFilterActive = minPrice > 0 || maxPrice < priceCeiling
  const hasActiveFilters =
    selectedCategory !== 'all' || debouncedSearch !== '' || priceFilterActive

  const activeFilterCount = [
    selectedCategory !== 'all',
    debouncedSearch !== '',
    priceFilterActive,
  ].filter(Boolean).length

  const priceHistogram = useMemo(
    () => buildPriceHistogram(services.map((s) => s.price), 0, priceCeiling),
    [services, priceCeiling]
  )

  const filteredServices = useMemo(() => {
    let filtered = services.filter((service) => {
      const matchesSearch =
        !debouncedSearch || service.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesPrice = service.price >= minPrice && service.price <= maxPrice
      return matchesSearch && matchesPrice
    })

    if (experienceFilters.length > 0) {
      filtered = filtered.filter((service) => {
        const rating = service.rating
        const checks: boolean[] = []
        if (experienceFilters.includes('exp_new')) checks.push(rating < 4 || rating === 0)
        if (experienceFilters.includes('exp_mid')) checks.push(rating >= 4 && rating < 4.7)
        if (experienceFilters.includes('exp_expert')) checks.push(rating >= 4.7)
        return checks.some(Boolean)
      })
    }

    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    } else if (sortBy === 'popular') {
      filtered = [...filtered].sort(
        (a, b) => b.rating * Math.max(b.reviewCount, 1) - a.rating * Math.max(a.reviewCount, 1)
      )
    }

    return filtered
  }, [services, debouncedSearch, minPrice, maxPrice, sortBy, experienceFilters])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedCategory, selectedRegion, minPrice, maxPrice, sortBy, viewMode])

  const paginatedServices = filteredServices

  const resetFilters = useCallback(() => {
    setSelectedCategory('all')
    setSearchTerm('')
    setDebouncedSearch('')
    setSortBy('popular')
    setPriceRange([0, priceCeiling])
    router.replace(pathname, { scroll: false })
  }, [pathname, priceCeiling, router])

  const categoryLabel = (id: string) => {
    const key = CATEGORY_KEYS[id]
    return key ? t(key) : id
  }

  const servicesFoundParts = t('services_found')
    .replace('{n}', String(filteredServices.length))
    .split(String(filteredServices.length))

  const activeCategoryForIcons = selectedCategory === 'all' ? null : selectedCategory

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
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={Math.max(Math.floor(priceCeiling / 50), 10_000)}
          value={maxPrice}
          onChange={(e) => setPriceRange(([low]) => [low, parseInt(e.target.value, 10)])}
          className="catalog-filter-range"
        />
        <p className="catalog-filter-range-label">
          0 — {formatPrice(maxPrice)}
        </p>
      </FilterSection>

      <FilterSection
        title={t('filter_region')}
        open={expandedSections.region}
        onToggle={() => setExpandedSections((s) => ({ ...s, region: !s.region }))}
      >
        <Select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          options={[{ value: '', label: t('cat_all') }, ...UZ_REGIONS.map((r) => ({ value: r, label: r }))]}
          className="catalog-control"
        />
      </FilterSection>

      <FilterSection
        title={t('filter_level')}
        open={expandedSections.experience}
        onToggle={() => setExpandedSections((s) => ({ ...s, experience: !s.experience }))}
      >
        <div className="catalog-filter-options">
          {(['exp_new', 'exp_mid', 'exp_expert'] as const).map((key) => (
            <label key={key} className="catalog-filter-option">
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
    </div>
  )

  return (
    <PageWrapper
      className="bg-[var(--kwork-bg)] pt-6 md:pt-8"
      breadcrumb={[
        { label: t('home'), href: PATHS.home },
        { label: t('nav_services') },
      ]}
    >
      <div className="catalog-shell">
        <div className={cn('catalog-shell-head catalog-title-band', isLoggedIn && 'catalog-shell-head--compact')}>
          <h1 className="catalog-shell-title">{t('nav_services')}</h1>
          <p className="catalog-shell-sub">
            {isLoggedIn ? t('services_found').replace('{n}', String(filteredServices.length)) : t('find_freelancer')}
          </p>
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
              <div className="catalog-results-meta">
                <div className="catalog-toolbar min-w-0 flex-1">
                  <SearchAutocomplete
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSubmit={() => setDebouncedSearch(searchTerm.trim())}
                    placeholder={t('search_services')}
                    className="catalog-toolbar-search w-full"
                    inputClassName="kwork-search-input"
                    variant="header"
                  />
                </div>
                {isLoggedIn && debouncedSearch ? (
                  <p className="catalog-results-query">
                    {t('search_services')}: <strong>{debouncedSearch}</strong>
                  </p>
                ) : isLoggedIn ? (
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
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="catalog-view-toggle hide-mobile">
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
                <Button
                  variant="outline"
                  size="md"
                  className="show-mobile h-[40px] shrink-0 px-3"
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
                <div className="catalog-toolbar-sort min-w-[160px] max-w-[220px] shrink-0 flex-1 sm:flex-none">
                  <span className="catalog-toolbar-sort-label">{t('sort_label')}</span>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                      { value: 'popular', label: t('sort_popular') },
                      { value: 'price-low', label: t('sort_price_asc') },
                      { value: 'price-high', label: t('sort_price_desc') },
                    ]}
                    wrapperClassName="min-w-0 flex-1"
                    className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
                  />
                </div>
              </div>
            </div>

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
              </div>
            )}

            {loading && !showSkeleton ? null : loading ? (
              <div className="catalog-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title={t('no_services_found')}
                description={t('no_services_desc')}
                action={{ label: t('clear_filters'), onClick: resetFilters }}
              />
            ) : (
              <>
                <div className={cn(viewMode === 'grid' ? 'catalog-grid' : 'catalog-list')}>
                  {paginatedServices.map((service) => (
                    <ServiceCard
                      key={`${service.id}-${savedTick}`}
                      title={service.title}
                      sellerName={service.freelancer}
                      sellerInitials={initials(service.freelancer)}
                      rating={service.rating}
                      reviewCount={service.reviewCount}
                      price={service.price}
                      category={service.category}
                      thumbnailUrl={service.thumbnailUrl}
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
                {hasMore && (
                  <div className="show-mobile mt-4 flex flex-col items-center gap-2">
                    <span className="text-[13px] text-[var(--kwork-text-muted)]">
                      {t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', '…')}
                    </span>
                    <Button variant="outline" size="lg" className="min-h-[44px] px-8" onClick={() => setCurrentPage((p) => p + 1)}>
                      {t('load_more')}
                    </Button>
                  </div>
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
                      {t('catalog_page_of').replace('{n}', String(currentPage)).replace('{total}', hasMore ? '…' : String(currentPage))}
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
    <div className="catalog-filter-section">
      <button type="button" onClick={onToggle} className="catalog-filter-section-btn">
        {title}
        <ChevronDown
          className={cn('h-4 w-4 text-[var(--kwork-text-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && children}
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
