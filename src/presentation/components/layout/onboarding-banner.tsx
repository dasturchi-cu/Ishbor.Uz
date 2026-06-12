'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { Button } from '@/presentation/components/ui/button'

export function OnboardingBanner() {
  const { profile, t } = useApp()

  if (!profile || profile.is_admin || profile.onboarding_completed) {
    return null
  }

  return (
    <div
      className="onboarding-banner layout-container mb-4 flex flex-col gap-3 rounded-[var(--r-card)] border border-[var(--color-primary)]/25 bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--surface-raised))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--ishbor-text)]">{t('onboarding_banner_title')}</p>
          <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('onboarding_banner_desc')}</p>
        </div>
      </div>
      <Link href={PATHS.onboarding} className="shrink-0">
        <Button variant="primary" size="sm">
          {t('onboarding_banner_cta')}
        </Button>
      </Link>
    </div>
  )
}
