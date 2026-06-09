'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { resolveLoadError } from '@/shared/lib/load-error'
import { logClientError } from '@/shared/lib/log-client-error'

export function RouteError({
  error,
  reset,
  homeHref,
  homeLabelKey = 'nav_dashboard',
}: {
  error: Error & { digest?: string }
  reset: () => void
  homeHref: string
  homeLabelKey?: 'nav_dashboard' | 'nav_services'
}) {
  const { t } = useApp()

  useEffect(() => {
    logClientError(error, { scope: 'generic', page: typeof window !== 'undefined' ? window.location.pathname : undefined })
    console.error(error)
  }, [error])

  const message = resolveLoadError(error, t, 'generic')

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error-bg)] text-[var(--error)]">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-[var(--ishbor-text)]">{message}</h1>
      <p className="mt-2 max-w-md text-[14px] text-[var(--ishbor-text-muted)]">{t('page_error_desc')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          {t('retry')}
        </Button>
        <Link href={homeHref}>
          <Button variant="outline">{t(homeLabelKey)}</Button>
        </Link>
      </div>
    </div>
  )
}
