'use client'



import { useCallback, useEffect, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import Link from 'next/link'

import { useApp } from '@/application/providers/app-provider'

import { PageWrapper } from '@/presentation/components/layout/page-wrapper'

import { EmptyState } from '@/presentation/components/ui/empty-state'

import { Button } from '@/presentation/components/ui/button'

import { Input } from '@/presentation/components/ui/input'

import { Select } from '@/presentation/components/ui/select'

import { api } from '@/infrastructure/api/client'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'

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

}



export function ProjectsCatalog({

  titleKey = 'projects_title',

  subtitleKey = 'projects_subtitle',

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
    api.trackAnalytics('search', { query: debouncedSearch, surface: 'projects' }).catch(() => undefined)
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



  const categoryLabel = (value: string) => {

    const key = CATEGORY_LABEL[value]

    return key ? t(key) : value

  }



  return (

    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">

      <div className="surface-panel mb-4 px-4 py-3.5 sm:px-5 sm:py-4">

        <h1 className="text-xl font-bold text-[var(--ishbor-text)] sm:text-[22px]">{t(titleKey)}</h1>

        <p className="mt-1 text-[13px] text-[var(--ishbor-text-muted)] sm:text-[14px]">{t(subtitleKey)}</p>

      </div>



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

          {[0, 1, 2].map((i) => (

            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />

          ))}

        </div>

      ) : projects.length === 0 ? (

        <EmptyState

          icon={<Briefcase />}

          title={t('no_projects_yet')}

          description={t('projects_subtitle')}

          action={{ label: t('post_project'), onClick: () => router.push(PATHS.postProject) }}

          secondaryAction={{

            label: t('nav_freelancers'),

            onClick: () => router.push(PATHS.freelancers),

            variant: 'outline',

          }}

        />

      ) : (

        <div className="space-y-3">

          {projects.map((p) => (

            <article key={p.id} className="dashboard-order-card sm:p-5">

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="text-[16px] font-bold text-[var(--ishbor-text)]">{p.title}</h2>

                    <Badge variant={projectStatusBadgeVariant(p.status)} size="xs">

                      {marketplaceStatusLabel(PROJECT_STATUS_KEYS, p.status, t)}

                    </Badge>

                  </div>

                  <p className="mt-1 line-clamp-2 text-[13px] text-[var(--ishbor-text-muted)]">{p.description}</p>

                  <p className="mt-2 text-[12px] text-[var(--ishbor-text-muted)]">

                    {p.region} · {categoryLabel(p.category)}

                  </p>

                </div>

                <p className="text-[16px] font-bold text-[var(--color-primary)]">{formatPrice(p.budget)}</p>

              </div>

              <div className="mt-3 flex flex-wrap gap-2">

                <Link href={projectPath(p.id)}>

                  <Button variant="primary" size="sm">

                    {t('project_view_detail')}

                  </Button>

                </Link>

                {(p.application_count ?? 0) > 0 && (

                  <span className="self-center text-[12px] text-[var(--ishbor-text-muted)]">

                    {t('project_applications_count').replace('{n}', String(p.application_count))}

                  </span>

                )}

              </div>

            </article>

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

