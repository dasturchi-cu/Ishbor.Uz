'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Scale, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiBuyerProtection, ApiPublicDisputeStats } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'

export function BuyerProtectionPage() {
  const { t } = useApp()
  const [data, setData] = useState<ApiBuyerProtection | null>(null)
  const [stats, setStats] = useState<ApiPublicDisputeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getBuyerProtection(), api.getPublicDisputeStats()])
      .then(([bp, ds]) => {
        setData(bp)
        setStats(ds)
      })
      .catch(() => {
        setData(null)
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageWrapper><LoadingBlock className="py-20" /></PageWrapper>

  const doc = data?.document

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-6 md:pt-10">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-[var(--color-primary)]" aria-hidden />
          <h1 className="text-2xl font-bold text-[var(--ishbor-text)]">{t('buyer_protection_title')}</h1>
          <p className="mt-2 text-[14px] text-[var(--ishbor-text-muted)]">{t('buyer_protection_subtitle')}</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="surface-panel p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[var(--success)]" />
            <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('buyer_protection_escrow')}</p>
            <p className="mt-1 text-[13px] text-[var(--ishbor-text)]">{t('buyer_protection_escrow_desc')}</p>
          </article>
          {stats && (
            <>
              <article className="surface-panel p-4 text-center">
                <Scale className="mx-auto mb-2 h-8 w-8 text-[var(--color-primary)]" />
                <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('buyer_protection_resolution_rate')}</p>
                <p className="text-[22px] font-bold text-[var(--ishbor-text)]">{stats.resolution_rate_percent}%</p>
              </article>
              <article className="surface-panel p-4 text-center">
                <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('buyer_protection_dispute_resolved')}</p>
                <p className="text-[22px] font-bold text-[var(--ishbor-text)]">{stats.resolved_disputes}</p>
                <p className="text-[11px] text-[var(--ishbor-text-muted)]">
                  {t('buyer_protection_dispute_open')}: {stats.open_disputes}
                </p>
              </article>
            </>
          )}
        </div>

        {doc && (
          <article className="surface-panel prose-sm max-w-none p-6">
            <h2 className="text-lg font-bold text-[var(--ishbor-text)]">{doc.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
              {doc.content}
            </p>
            <p className="mt-4 text-[11px] text-[var(--ishbor-text-muted)]">v{doc.version}</p>
          </article>
        )}

        <p className="mt-8 text-center text-[13px]">
          <Link href={PATHS.services} className="font-semibold text-[var(--color-primary)] hover:underline">
            {t('nav_services')}
          </Link>
        </p>
      </div>
    </PageWrapper>
  )
}
