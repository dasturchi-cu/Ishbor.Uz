'use client'

import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'

export function ProfileCompletionBar({ className }: { className?: string }) {
  const { t, profile, currentUserRole } = useApp()
  const role = currentUserRole === 'freelancer' ? 'freelancer' : 'client'
  const pct = profileCompletionPercent(profile, role)

  if (pct >= 100) return null

  return (
    <div className={className ?? 'rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4'}>
      <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--ishbor-text-muted)]">
        <span>{t('profile_completion').replace('{n}', String(pct))}</span>
        <Link href={PATHS.dashboardProfile} className="font-medium text-[var(--color-primary)]">
          {t('profile_complete_link')}
        </Link>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ishbor-border)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
