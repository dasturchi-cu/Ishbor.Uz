'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Select } from '@/presentation/components/ui/select'
import { api } from '@/infrastructure/api/client'
import type { ApiProject } from '@/infrastructure/api/types'
import { PATHS, projectPath } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { formatPrice } from '@/shared/lib/format'
import { Briefcase } from 'lucide-react'
import type { TranslationKey } from '@/infrastructure/i18n'

const CATEGORY_OPTIONS = [
  { value: '', labelKey: 'filter_all_categories' as TranslationKey },
  { value: 'design', labelKey: 'cat_graphic' as TranslationKey },
  { value: 'web', labelKey: 'cat_web' as TranslationKey },
  { value: 'mobile', labelKey: 'cat_mobile' as TranslationKey },
  { value: 'writing', labelKey: 'cat_writing' as TranslationKey },
  { value: 'video', labelKey: 'cat_video' as TranslationKey },
  { value: 'seo', labelKey: 'cat_seo' as TranslationKey },
]

export function ProjectsCatalog() {
  const { t } = useApp()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const pageSize = 12

  useEffect(() => {
    setOffset(0)
  }, [debouncedSearch, region, category])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  const loadProjects = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    api
      .listProjects({
        status: 'open',
        q: debouncedSearch || undefined,
        region: region || undefined,
        category: category || undefined,
        limit: pageSize,
        offset,
      })
      .then((rows) => {
        setProjects((prev) => (offset === 0 ? rows : [...prev, ...rows]))
        setHasMore(rows.length >= pageSize)
      })
      .catch(() => {
        if (offset === 0) setProjects([])
        setHasMore(false)
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, region, category, offset, reloadTick])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-6">
      <div className="surface-panel mb-4 px-4 py-3.5 sm:px-5 sm:py-4">
        <h1 className="text-xl font-bold text-[var(--kwork-text)] sm:text-[22px]">{t('projects_title')}</h1>
        <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)] sm:text-[14px]">{t('projects_subtitle')}</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {loadError && offset === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={t('catalog_load_error')}
          action={{ label: t('catalog_retry'), onClick: () => setReloadTick((n) => n + 1) }}
        />
      ) : loading ? (
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
          action={{ label: t('post_project'), onClick: () => window.location.assign(PATHS.postProject) }}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <article key={p.id} className="dashboard-order-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-bold text-[var(--kwork-text)]">{p.title}</h2>
                  <p className="mt-1 line-clamp-2 text-[13px] text-[var(--kwork-text-muted)]">{p.description}</p>
                  <p className="mt-2 text-[12px] text-[var(--kwork-text-muted)]">
                    {p.region} · {p.category}
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
                  <span className="self-center text-[12px] text-[var(--kwork-text-muted)]">
                    {t('project_applications_count').replace('{n}', String(p.application_count))}
                  </span>
                )}
              </div>
            </article>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" loading={loading} onClick={() => setOffset((o) => o + pageSize)}>
                {t('projects_load_more')}
              </Button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
