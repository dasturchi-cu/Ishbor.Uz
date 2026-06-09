'use client'

import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { isSafeExternalWebsiteUrl } from '@/shared/lib/safe-url'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { Card } from '@/presentation/components/ui/card'
export function CompaniesCatalog() {
  const { t } = useApp()
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listCompanies({ limit: 24, featured: true })
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--kwork-text)]">{t('companies_catalog_title')}</h1>
        <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">{t('companies_catalog_subtitle')}</p>
      </div>
      {loading ? (
        <LoadingBlock className="py-16" />
      ) : companies.length === 0 ? (
        <EmptyState icon={<Building2 className="h-14 w-14" />} title={t('admin_companies_empty')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[var(--kwork-text)]">{company.name}</h3>
                {company.is_verified && (
                  <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                    {t('badge_verified')}
                  </span>
                )}
              </div>
              {company.region && (
                <p className="mb-2 text-[12px] text-[var(--kwork-text-muted)]">{company.region}</p>
              )}
              {company.description && (
                <p className="line-clamp-3 text-[13px] text-[var(--kwork-text-sub)]">{company.description}</p>
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
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
