'use client'

import '@/presentation/styles/route-catalog.css'


import { useCallback, useEffect, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import Link from 'next/link'

import { useApp } from '@/application/providers/app-provider'

import { PageWrapper } from '@/presentation/components/layout/page-wrapper'

import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'

import { EmptyState } from '@/presentation/components/ui/empty-state'

import { Button } from '@/presentation/components/ui/button'

import { Input } from '@/presentation/components/ui/input'

import { Select } from '@/presentation/components/ui/select'

import { api } from '@/infrastructure/api/client'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

import type { ApiProject } from '@/infrastructure/api/types'

import { PATHS, projectPath } from '@/domain/constants/routes'

import { UZ_REGIONS } from '@/domain/constants/regions'

import { formatPrice } from '@/shared/lib/format'

import { Briefcase } from 'lucide-react'

import type { TranslationKey } from '@/infrastructure/i18n'

import { Badge } from '@/presentation/components/ui/badge'

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

  const { t } = useApp()
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



  return (

    <PageWrapper id="projects-catalog" className="bg-[var(--ishbor-bg)] pt-6 md:pt-8">

      {!hideHeader && (

        <div className="catalog-shell-head mb-5">

          <h1 className="catalog-shell-title">{t(titleKey)}</h1>

          <p className="catalog-shell-subtitle">{t(subtitleKey)}</p>

        </div>

      )}

      <IshborProtectionStrip compact className="mb-5" />



      <div className="mb-4 flex flex-col gap-3">

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">

          <Input

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            placeholder={t('project_search_ph')}

            className="sm:max-w-xs"

          />

          <Select

            value={region}

            onChange={(e) => setRegion(e.target.value)}

            className="select-auth sm:max-w-[200px]"

            options={[

              { value: '', label: t('filter_all_regions') },

              ...UZ_REGIONS.map((r) => ({ value: r, label: r })),

            ]}

          />

          <Select

            value={category}

            onChange={(e) => setCategory(e.target.value)}

            className="select-auth sm:max-w-[200px]"

            options={CATEGORY_OPTIONS.map((opt) => ({

              value: opt.value,

              label: t(opt.labelKey),

            }))}

          />

        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

          <Input

            value={budgetMin}

            onChange={(e) => setBudgetMin(e.target.value)}

            label={t('filter_budget_from')}

            inputMode="numeric"

            placeholder="100 000"

            className="sm:max-w-[160px]"

          />

          <Input

            value={budgetMax}

            onChange={(e) => setBudgetMax(e.target.value)}

            label={t('filter_budget_to')}

            inputMode="numeric"

            placeholder="5 000 000"

            className="sm:max-w-[160px]"

          />

        </div>

      </div>



      {!initialLoading && !catalogFetchError && projects.length > 0 && (

        <p className="mb-3 text-[13px] text-[var(--ishbor-text-muted)]">

          {t('projects_results_count').replace('{n}', String(projects.length))}

          {hasMore ? '+' : ''}

        </p>

      )}



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

        <EmptyState

          icon={<Briefcase />}

          title={hasActiveFilters ? t('no_projects_filtered') : t('no_projects_yet')}

          description={hasActiveFilters ? t('no_services_desc') : t('projects_empty_desc')}

          action={
            hasActiveFilters
              ? { label: t('clear_filters'), onClick: () => {
                  setSearch('')
                  setDebouncedSearch('')
                  setRegion('')
                  setCategory('')
                  setBudgetMin('')
                  setBudgetMax('')
                  router.replace(pathname, { scroll: false })
                } }
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

      ) : (

        <div className="space-y-3">

          {projects.map((p) => (

            <Link key={p.id} href={projectPath(p.id)} className="project-catalog-card group block">

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="text-[17px] font-bold text-[var(--ishbor-text)] transition group-hover:text-[var(--color-primary)]">{p.title}</h2>

                    <Badge variant={projectStatusBadgeVariant(p.status)} size="xs">

                      {marketplaceStatusLabel(PROJECT_STATUS_KEYS, p.status, t)}

                    </Badge>

                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[var(--ishbor-text-muted)]">{p.description}</p>

                  <p className="mt-2.5 text-[12px] font-medium text-[var(--ishbor-text-sub)]">

                    {p.region}

                    <span className="mx-1.5 text-[var(--ishbor-text-muted)]">·</span>

                    {categoryLabel(p.category)}

                    {(p.application_count ?? 0) > 0 && (

                      <>

                        <span className="mx-1.5 text-[var(--ishbor-text-muted)]">·</span>

                        {t('project_applications_count').replace('{n}', String(p.application_count))}

                      </>

                    )}

                  </p>

                </div>

                <p className="text-[18px] font-bold tabular-nums text-[var(--color-primary)]">{formatPrice(p.budget)}</p>

              </div>

            </Link>

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

    </PageWrapper>

  )

}

