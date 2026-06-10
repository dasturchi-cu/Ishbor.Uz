'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, ExternalLink, MapPin, Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Avatar } from '@/presentation/components/ui/avatar'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { isSafeExternalWebsiteUrl } from '@/shared/lib/safe-url'
import { formatDate } from '@/shared/lib/format-date'

export function CompanyDetailPage({ slug }: { slug: string }) {
  const { t, language } = useApp()
  const router = useRouter()
  const [company, setCompany] = useState<ApiCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<unknown>(null)

  const loadCompany = useCallback(() => {
    setLoading(true)
    setFetchError(null)
    api
      .getCompany(slug)
      .then(setCompany)
      .catch((e) => {
        setCompany(null)
        setFetchError(e instanceof ApiError && e.status === 404 ? null : e)
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    loadCompany()
  }, [loadCompany])

  if (loading) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </PageWrapper>
    )
  }

  if (!company) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        {fetchError ? (
          <LoadErrorAlert error={fetchError} scope="companies" onRetry={loadCompany} />
        ) : (
          <EmptyState
            icon={<Building2 />}
            title={t('company_not_found')}
            description={t('company_not_found_desc')}
            action={{ label: t('companies_catalog_title'), onClick: () => router.push(PATHS.companies) }}
          />
        )}
      </PageWrapper>
    )
  }

  const websiteSafe = company.website && isSafeExternalWebsiteUrl(company.website)

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">
      <Breadcrumb
        items={[
          { label: t('home'), href: PATHS.home },
          { label: t('companies_catalog_title'), href: PATHS.companies },
          { label: company.name },
        ]}
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_320px]">
        <article className="surface-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={company.name} src={company.logo_url} size={64} className="company-detail__logo" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold text-[var(--ishbor-text)] sm:text-[26px]">{company.name}</h1>
                {company.is_verified && (
                  <Badge variant="primary" size="xs">
                    {t('badge_verified')}
                  </Badge>
                )}
                {company.stir_verified && (
                  <Badge variant="outline" size="xs">
                    {t('company_stir_verified')}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--ishbor-text-muted)]">
                {company.region && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {company.region}
                  </span>
                )}
                {company.employee_count != null && company.employee_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {t('company_employees').replace('{count}', String(company.employee_count))}
                  </span>
                )}
                {company.created_at && (
                  <span>
                    {t('company_member_since')}: {formatDate(company.created_at, language)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {company.description && (
            <p className="mt-6 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
              {company.description}
            </p>
          )}

          {websiteSafe && (
            <a
              href={company.website!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] hover:underline"
            >
              {company.website!.replace(/^https?:\/\//, '')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </article>

        <aside className="space-y-4">
          <div className="surface-panel p-5">
            <h2 className="settings-section-title mb-3">{t('company_hire_title')}</h2>
            <p className="mb-4 text-[13px] text-[var(--ishbor-text-muted)]">{t('company_hire_desc')}</p>
            <div className="space-y-2">
              <Link href={PATHS.freelancers}>
                <Button variant="primary" fullWidth>
                  {t('company_hire_cta')}
                </Button>
              </Link>
              <Link href={PATHS.postProject}>
                <Button variant="outline" fullWidth>
                  {t('company_post_project_cta')}
                </Button>
              </Link>
              <Link href={PATHS.jobs}>
                <Button variant="outline" fullWidth>
                  {t('company_view_jobs')}
                </Button>
              </Link>
            </div>
          </div>
          <IshborProtectionStrip compact />
        </aside>
      </div>
    </PageWrapper>
  )
}
