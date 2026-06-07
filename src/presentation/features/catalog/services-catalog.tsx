'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { ArrowRight, Search, MapPin, Sparkles } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiService } from '@/infrastructure/api/types'
import { servicePath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'

type CatalogService = {
  id: string
  title: string
  description: string
  category: string
  freelancer: string
  price: number
  location: string
}

const CATEGORY_ACCENT: Record<string, string> = {
  web: 'bg-blue-500',
  mobile: 'bg-violet-500',
  uiux: 'bg-pink-500',
  graphic: 'bg-fuchsia-500',
  writing: 'bg-amber-500',
  video: 'bg-red-500',
  seo: 'bg-emerald-500',
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

function mapApiService(s: ApiService): CatalogService {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    freelancer: s.profiles?.full_name ?? 'Freelancer',
    price: s.price,
    location: s.region,
  }
}

function roundCeiling(n: number): number {
  if (n <= 0) return 5_000_000
  const step = n > 10_000_000 ? 1_000_000 : 100_000
  return Math.ceil(n / step) * step
}

export function ServicesCatalog() {
  const { t } = useApp()
  const router = useRouter()
  const [services, setServices] = useState<CatalogService[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [priceCeiling, setPriceCeiling] = useState(5_000_000)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(id)
  }, [searchTerm])

  useEffect(() => {
    setLoading(true)
    api
      .listServices({
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      })
      .then((data) => {
        const mapped = data.map(mapApiService)
        setServices(mapped)
        const top = mapped.reduce((acc, s) => Math.max(acc, s.price), 0)
        const ceiling = roundCeiling(top)
        setPriceCeiling(ceiling)
        setMaxPrice((prev) => (prev === null || prev > ceiling ? ceiling : prev))
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [debouncedSearch, selectedCategory])

  const categories = [
    { id: 'all', label: t('cat_all') },
    { id: 'web', label: t('cat_web') },
    { id: 'mobile', label: t('cat_mobile') },
    { id: 'uiux', label: t('cat_uiux') },
    { id: 'graphic', label: t('cat_graphic') },
    { id: 'writing', label: t('cat_writing') },
    { id: 'video', label: t('cat_video') },
    { id: 'seo', label: t('cat_seo') },
  ]

  const effectiveMaxPrice = maxPrice ?? priceCeiling
  const hasActiveFilters =
    selectedCategory !== 'all' || debouncedSearch !== '' || effectiveMaxPrice < priceCeiling

  const filteredServices = useMemo(() => {
    let filtered = services.filter((service) => {
      const matchesSearch =
        !debouncedSearch || service.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesPrice = service.price <= effectiveMaxPrice
      return matchesSearch && matchesPrice
    })

    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [services, debouncedSearch, effectiveMaxPrice, sortBy])

  const resetFilters = useCallback(() => {
    setSelectedCategory('all')
    setSearchTerm('')
    setDebouncedSearch('')
    setSortBy('popular')
    setMaxPrice(priceCeiling)
  }, [priceCeiling])

  const categoryLabel = (id: string) => {
    const key = CATEGORY_KEYS[id]
    return key ? t(key) : id
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-responsive py-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              IshBor.uz
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-balance">
              {t('browse_services')}
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">{t('find_freelancer')}</p>
          </div>

          {/* Search */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('search_services')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-shadow"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-12 px-4 rounded-xl bg-card border border-border text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary sm:min-w-[200px]"
            >
              <option value="popular">{t('sort_popular')}</option>
              <option value="price-low">{t('sort_price_low')}</option>
              <option value="price-high">{t('sort_price_high')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container-responsive py-3 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-md">
              <span className="text-xs font-medium text-muted-foreground shrink-0">{t('price_range')}</span>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={Math.max(Math.floor(priceCeiling / 50), 10_000)}
                value={effectiveMaxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                className="flex-1 accent-primary h-1.5"
              />
              <span className="text-xs font-semibold text-foreground tabular-nums shrink-0 w-20 text-right">
                {formatPrice(effectiveMaxPrice)}
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {!loading && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{filteredServices.length}</span>{' '}
                  {t('services').toLowerCase()}
                </span>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-responsive py-8 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-12 bg-muted rounded" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">{t('no_services_found')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('find_freelancer')}</p>
            <Button variant="outline" onClick={resetFilters}>
              {t('clear_filters')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredServices.map((service) => {
              const accent = CATEGORY_ACCENT[service.category] ?? 'bg-primary'
              return (
                <article
                  key={service.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(servicePath(service.id))}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(servicePath(service.id))}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-full ${accent} opacity-80`} />

                  <div className="pl-3 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryLabel(service.category)}
                      </span>
                      <p className="text-xl font-bold text-primary tabular-nums shrink-0">
                        {formatPrice(service.price)}
                      </p>
                    </div>

                    <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {service.title}
                    </h2>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-5">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {service.freelancer.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{service.freelancer}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {service.location}
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {t('view')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
