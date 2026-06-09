'use client'

import { useApp } from '@/application/providers/app-provider'

export function AuthPageFallback() {
  const { t } = useApp()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ishbor-bg)]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ishbor-border)] border-t-[var(--color-primary)]" />
        <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('auth_callback_loading')}</p>
      </div>
    </div>
  )
}
