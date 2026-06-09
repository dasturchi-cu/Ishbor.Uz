'use client'

import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function LoadingBlock({ className }: { className?: string }) {
  const { t } = useApp()
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <div className="loading-spinner" role="status" aria-hidden />
      <p className="text-[14px] text-[var(--ishbor-text-muted)]">{t('loading_data')}</p>
    </div>
  )
}
