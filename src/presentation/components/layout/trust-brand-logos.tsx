'use client'

import { useApp } from '@/application/providers/app-provider'

export function TrustBrandLogos({ className }: { className?: string }) {
  const { t } = useApp()

  return (
    <div className={className}>
      <p className="text-center text-[13px] leading-relaxed text-[var(--kwork-text-muted)]">
        {t('trust_partners_soon')}
      </p>
    </div>
  )
}
