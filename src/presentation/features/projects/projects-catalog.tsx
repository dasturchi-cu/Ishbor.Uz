'use client'

import '@/presentation/styles/route-catalog.css'


import { useCallback, useEffect, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useApp } from '@/application/providers/app-provider'
import { ProjectCard } from '@/presentation/components/features/project-card'

import { PageWrapper } from '@/presentation/components/layout/page-wrapper'

import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { MarketplaceTrustMetrics } from '@/presentation/components/layout/marketplace-trust-metrics'

import { EmptyState } from '@/presentation/components/ui/empty-state'
import { SearchDiscoveryHints } from '@/presentation/components/features/search-discovery-hints'

import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'

import { Input } from '@/presentation/components/ui/input'

import { Select } from '@/presentation/components/ui/select'

import { api } from '@/infrastructure/api/client'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { trackActivationEvent } from '@/shared/lib/funnel-analytics'

import type { ApiProject } from '@/infrastructure/api/types'

import { PATHS, projectPath } from '@/domain/constants/routes'

import { UZ_REGIONS } from '@/domain/constants/regions'

import { Briefcase, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'

import type { TranslationKey } from '@/infrastructure/i18n'

import {

  PROJECT_STATUS_KEYS,

  marketplaceStatusLabel,

  projectStatusBadgeVariant,

} from '@/shared/lib/marketplace-status'



const CATEGORY_OPTIONS = [

  { value: '', labelKey: 'filter_all_categories' as TranslationKey },

  { value: 'design', labelKey: 'cat_graphic' as TranslationKey },

  { value: 'web', labelKey: 'cat_web' as TranslationKey },

  { value: 'mobile', labelKey: 'cat_mobile' as TranslationKey },

  { value: 'writing', labelKey: 'cat_writing' as TranslationKey },

  { value: 'video', labelKey: 'cat_video' as TranslationKey },

  { value: 'seo', labelKey: 'cat_seo' as TranslationKey },

]



const CATEGORY_LABEL: Record<string, TranslationKey> = {

  design: 'cat_graphic',

  web: 'cat_web',

  mobile: 'cat_mobile',

  writing: 'cat_writing',

  video: 'cat_video',

  seo: 'cat_seo',

}



interface ProjectsCatalogProps {

  titleKey?: TranslationKey

  subtitleKey?: TranslationKey

  hideHeader?: boolean

}



export function ProjectsCatalog({

  titleKey = 'projects_title',

  subtitleKey = 'projects_subtitle',

  hideHeader = false,

}: ProjectsCatalogProps = {}) {

  const { t, currentUserRole } = useApp()
  const { authed } = useAuthReady()

  const router = useRouter()

  const pathname = usePathname()

  const searchParams = useSearchParams()

  const urlSynced = useRef(false)



  const [projects, setProjects] = useState<ApiProject[]>([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [region, setRegion] = useState('')

  const [category, setCategory] = useState('')

  const [budgetMin, setBudgetMin] = useState('')

  const [budgetMax, setBudgetMax] = useState('')

  const [offset, setOffset] = useState(0)

  const [hasMore, setHasMore] = useState(false)

  const [catalogFetchError, setCatalogFetchError] = useState<unknown>(null)

  const [reloadTick, setReloadTick] = useState(0)

  const pageSize = 12
  const [filterOpen, setFilterOpen] = useState(false)
  const filterDrawerRef = useRef<HTMLDivElement>(null)

  useEscapeClose(filterOpen, () => setFilterOpen(false))
  useFocusTrap(filterOpen, filterDrawerRef)
  useBodyScrollLock(filterOpen)

  useEffect(() => {

    if (urlSynced.current) return

    urlSynced.current = true

    const q = searchParams.get('q')

    const r = searchParams.get('region')

    const c = searchParams.get('category')

    const bmin = searchParams.get('budget_min')

    const bmax = searchParams.get('budget_max')

    if (q) setSearch(q)

    if (r) setRegion(r)

    if (c) setCategory(c)

    if (bmin) setBudgetMin(bmin)

    if (bmax) setBudgetMax(bmax)

  }, [searchParams])



  useEffect(() => {

    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)

    return () => window.clearTimeout(id)

  }, [search])

  useEffect(() => {
    if (!authed || !debouncedSearch || debouncedSearch.length < 2) return
    api
      .trackAnalytics('search', { query: debouncedSearch, surface: 'projects' })
      .catch((e) => ignoreWithLog(e, { scope: 'analytics', apiPath: '/api/v1/platform/analytics' }))
  }, [authed, debouncedSearch])

  useEffect(() => {
    if (!authed || currentUserRole !== 'client') return
    trackActivationEvent('employer_first_action', { action: 'browse_projects' })
  }, [authed, currentUserRole])

  useEffect(() => {

    setOffset(0)

  }, [debouncedSearch, region, category, budgetMin, budgetMax])



  useEffect(() => {

    const params = new URLSearchParams()

    if (debouncedSearch) params.set('q', debouncedSearch)

    if (region) params.set('region', region)

    if (category) params.set('category', category)

    if (budgetMin.trim()) params.set('budget_min', budgetMin.replace(/\D/g, ''))

    if (budgetMax.trim()) params.set('budget_max', budgetMax.replace(/\D/g, ''))

    const qs = params.toString()

    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })

  }, [debouncedSearch, region, category, budgetMin, budgetMax, pathname, router])



  const parsedBudgetMin = budgetMin.trim() ? parseInt(budgetMin.replace(/\D/g, ''), 10) : undefined

  const parsedBudgetMax = budgetMax.trim() ? parseInt(budgetMax.replace(/\D/g, ''), 10) : undefined



  const loadProjects = useCallback(() => {

    setLoading(true)

    setCatalogFetchError(null)

    api

      .listProjects({

        status: 'open',

        q: debouncedSearch || undefined,

        region: region || undefined,

        category: category || undefined,

        budget_min: parsedBudgetMin,

        budget_max: parsedBudgetMax,

        limit: pageSize,

        offset,

      })

      .then((rows) => {

        setProjects((prev) => (offset === 0 ? rows : [...prev, ...rows]))

        setHasMore(rows.length >= pageSize)

      })

      .catch((e) => {

        if (offset === 0) setProjects([])

        setHasMore(false)

        setCatalogFetchError(e)

      })

      .finally(() => setLoading(false))

  }, [debouncedSearch, region, category, parsedBudgetMin, parsedBudgetMax, offset])



  useEffect(() => {

    loadProjects()

  }, [loadProjects, reloadTick])



  const initialLoading = loading && offset === 0

  const loadingMore = loading && offset > 0

  const hasActiveFilters =
    debouncedSearch !== '' ||
    region !== '' ||
    category !== '' ||
    budgetMin.trim() !== '' ||
    budgetMax.trim() !== ''



  const categoryLabel = (value: string) => {

    const key = CATEGORY_LABEL[value]

    return key ? t(key) : value

  }

  const activeFilterCount = [region, category, budgetMin.trim(), budgetMax.trim()].filter(Boolean).length

  const filterFields = (
    <>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('region')}</span>
        <Select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={[
            { value: '', label: t('filter_all_regions') },
            ...UZ_REGIONS.map((r) => ({ value: r, label: r })),
          ]}
          wrapperClassName="min-w-0 flex-1"
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
          aria-label={t('region')}
        />
      </div>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('category')}</span>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORY_OPTIONS.map((opt) => ({
            value: opt.value,
            label: t(opt.labelKey),
          }))}
          wrapperClassName="min-w-0 flex-1"
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
          aria-label={t('category')}
        />
      </div>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('filter_budget_from')}</span>
        <Input
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
          inputMode="numeric"
          placeholder={t('budget_placeholder_min')}
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
        />
      </div>
      <div className="catalog-toolbar-sort min-w-0 flex-1">
        <span className="catalog-toolbar-sort-label">{t('filter_budget_to')}</span>
        <Input
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          inputMode="numeric"
          placeholder={t('budget_placeholder_max')}
          className="!h-full !min-h-0 !border-0 !bg-transparent !p-0 !shadow-none focus:!shadow-none"
        />
      </div>
    </>
  )

  return (

    <PageWrapper
      id={hideHeader ? 'projects-catalog' : 'projects-catalog'}
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



      <div className="mb-4">
        <div className="catalog-toolbar">
          <div className="catalog-toolbar-search relative">
            <div className="catalog-toolbar-search-field">
              <Search className="h-4 w-4" />
              <input
                type="search"
                className="ishbor-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('project_search_ph')}
                aria-label={t('project_search_ph')}
              />
            </div>
            <button
              type="button"
              className="catalog-toolbar-search-btn"
              aria-label={t('show_search_results')}
              onClick={() => document.getElementById('project-results')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <div className="hide-mobile catalog-toolbar-actions">{filterFields}</div>

          <div className="show-mobile shrink-0">
            <Button
              variant="outline"
              size="md"
              className="catalog-toolbar-filter-btn"
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

      <p id="project-results" className="mb-4 min-h-[20px] px-0.5 text-[13px] text-[var(--ishbor-text-sub)]">
        {initialLoading ? (
          <span className="inline-block h-4 w-36 animate-pulse rounded-full bg-[var(--color-bg-muted)]" aria-label={t('loading_data')} />
        ) : !catalogFetchError && projects.length > 0 ? (
          <span className="catalog-results-count-pill inline-flex">
            {t('projects_results_count').replace('{n}', String(projects.length))}
            {hasMore ? '+' : ''}
          </span>
        ) : null}
      </p>



      {catalogFetchError && offset === 0 ? (

        <EmptyState

          icon={<Briefcase />}

          title={captureLoadError(catalogFetchError, { scope: 'catalog' }, t)}

          action={{ label: t('catalog_retry'), onClick: () => setReloadTick((n) => n + 1) }}

        />

      ) : initialLoading ? (

        <div className="space-y-3">

          {[0, 1, 2, 3].map((i) => (

            <div key={i} className="project-catalog-card-skeleton animate-pulse rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5">

              <div className="flex justify-between gap-4">

                <div className="min-w-0 flex-1 space-y-2">

                  <div className="h-5 w-2/3 rounded bg-[var(--ishbor-bg-muted)]" />

                  <div className="h-3 w-full rounded bg-[var(--ishbor-bg-muted)]" />

                  <div className="h-3 w-1/3 rounded bg-[var(--ishbor-bg-muted)]" />

                </div>

                <div className="h-6 w-24 shrink-0 rounded bg-[var(--ishbor-bg-muted)]" />

              </div>

            </div>

          ))}

        </div>

      ) : projects.length === 0 ? (

        <div className="mx-auto w-full max-w-lg">
          <EmptyState
            icon={<Briefcase />}
            title={hasActiveFilters ? t('no_projects_filtered') : t('no_projects_yet')}
            description={hasActiveFilters ? t('no_projects_filtered_desc') : t('projects_empty_desc')}
            action={
              hasActiveFilters
                ? {
                    label: t('clear_filters'),
                    onClick: () => {
                      setSearch('')
                      setDebouncedSearch('')
                      setRegion('')
                      setCategory('')
                      setBudgetMin('')
                      setBudgetMax('')
                      router.replace(pathname, { scroll: false })
                    },
                  }
                : { label: t('post_project'), onClick: () => router.push(PATHS.postProject) }
            }
            secondaryAction={
              hasActiveFilters
                ? undefined
                : {
                    label: t('nav_freelancers'),
                    onClick: () => router.push(PATHS.freelancers),
                    variant: 'outline',
                  }
            }
          />
          {debouncedSearch ? <SearchDiscoveryHints query={debouncedSearch} /> : null}
        </div>

      ) : (

        <div className="space-y-3">

          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              href={projectPath(p.id)}
              title={p.title}
              description={p.description}
              budget={p.budget}
              region={p.region}
              categoryLabel={categoryLabel(p.category)}
              statusLabel={marketplaceStatusLabel(PROJECT_STATUS_KEYS, p.status, t)}
              statusVariant={projectStatusBadgeVariant(p.status)}
              applicationCount={p.application_count ?? 0}
            />
          ))}

          {hasMore && (

            <div className="flex justify-center pt-2">

              <Button variant="outline" size="sm" loading={loadingMore} onClick={() => setOffset((o) => o + pageSize)}>

                {t('projects_load_more')}

              </Button>

            </div>

          )}

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

