'use client'

import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function LoadingBlock({ className }: { className?: string }) {
  const { t } = useApp()
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--kwork-border)] border-t-[var(--color-primary)]" />
      <p className="text-[14px] text-[var(--kwork-text-muted)]">{t('loading_data')}</p>
    </div>
  )
}
