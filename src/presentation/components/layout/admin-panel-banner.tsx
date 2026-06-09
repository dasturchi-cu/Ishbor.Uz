'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { Button } from '@/presentation/components/ui/button'

export function AdminPanelBanner({ className }: { className?: string }) {
  const { t, profile } = useApp()

  if (!profile?.is_admin) return null

  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-light)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <Shield className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-[var(--ishbor-text)]">{t('admin_panel')}</p>
          <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('admin_panel_banner_hint')}</p>
        </div>
      </div>
      <Link href={PATHS.admin}>
        <Button variant="primary" size="sm" className="shrink-0">
          {t('admin_panel_open')}
        </Button>
      </Link>
    </div>
  )
}
