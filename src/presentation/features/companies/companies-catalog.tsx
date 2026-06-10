'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { isSafeExternalWebsiteUrl } from '@/shared/lib/safe-url'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { useRouter } from 'next/navigation'
import { PATHS, companyPath } from '@/domain/constants/routes'
import { Button } from '@/presentation/components/ui/button'

function CompanyCardSkeleton() {
  return (
    <div className="company-catalog-card animate-pulse rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 rounded bg-[var(--ishbor-bg-muted)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--ishbor-bg-muted)]" />
      </div>
      <div className="mb-2 h-3 w-1/3 rounded bg-[var(--ishbor-bg-muted)]" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[var(--ishbor-bg-muted)]" />
        <div className="h-3 w-5/6 rounded bg-[var(--ishbor-bg-muted)]" />
      </div>
    </div>
  )
}

export function CompaniesCatalog({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useApp()
  const router = useRouter()
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)

  const loadCompanies = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    api
      .listCompanies({ limit: 24, featured: true })
      .then((rows) => {
        setCompanies(rows)
        setLoadError(null)
      })
      .catch((e) => {
        setCompanies([])
        setLoadError(e)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-6 md:pt-8">
      {!hideHeader && (
        <div className="catalog-shell-head mb-5">
          <h1 className="catalog-shell-title">{t('companies_catalog_title')}</h1>
          <p className="catalog-shell-subtitle">{t('companies_catalog_subtitle')}</p>
        </div>
      )}

      <IshborProtectionStrip compact className="mb-5" />

      {loadError ? (
        <LoadErrorAlert error={loadError} scope="companies" onRetry={loadCompanies} className="mb-4" />
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? null : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-14 w-14" />}
          title={t('companies_empty_public_title')}
          description={t('companies_empty_desc')}
          action={{ label: t('post_project'), onClick: () => router.push(PATHS.postProject) }}
          secondaryAction={{
            label: t('nav_freelancers'),
            onClick: () => router.push(PATHS.freelancers),
            variant: 'outline',
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <Link key={company.id} href={companyPath(company.slug)} className="company-catalog-card block">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="company-catalog-card__mark" aria-hidden>
                    {company.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-bold text-[var(--ishbor-text)]">{company.name}</h3>
                    {company.region && (
                      <p className="mt-0.5 text-[12px] font-medium text-[var(--ishbor-text-muted)]">{company.region}</p>
                    )}
                  </div>
                </div>
                {company.is_verified && (
                  <span className="shrink-0 rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                    {t('badge_verified')}
                  </span>
                )}
              </div>
              {company.description && (
                <p className="line-clamp-3 text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
                  {company.description}
                </p>
              )}
              {company.website && isSafeExternalWebsiteUrl(company.website) && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[12px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && !loadError && companies.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={PATHS.projects}>
            <Button variant="outline">{t('nav_projects')}</Button>
          </Link>
          <Link href={PATHS.freelancers}>
            <Button variant="primary">{t('nav_freelancers')}</Button>
          </Link>
        </div>
      )}
    </PageWrapper>
  )
}
