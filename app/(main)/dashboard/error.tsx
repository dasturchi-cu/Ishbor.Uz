'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useApp()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error-bg)] text-[var(--error)]">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-[var(--kwork-text)]">{t('page_error_title')}</h1>
      <p className="mt-2 max-w-md text-[14px] text-[var(--kwork-text-muted)]">{t('page_error_desc')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          {t('retry')}
        </Button>
        <Link href={PATHS.dashboardFreelancer}>
          <Button variant="outline">{t('nav_dashboard')}</Button>
        </Link>
      </div>
    </div>
  )
}
