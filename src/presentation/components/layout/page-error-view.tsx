'use client'

import Link from 'next/link'
import { AlertCircle, LifeBuoy } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { AuthPageBrand } from '@/presentation/components/layout/brand-logo'
import { PATHS } from '@/domain/constants/routes'

export interface PageErrorViewProps {
  title: string
  description: string
  onRetry?: () => void
  retryLabel?: string
  digest?: string
  showChrome?: boolean
}

export function PageErrorView({
  title,
  description,
  onRetry,
  retryLabel,
  digest,
  showChrome = true,
}: PageErrorViewProps) {
  const { t } = useApp()

  const body = (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center outline-none"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error-bg)] text-[var(--error)]">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-[var(--ishbor-text)]">{title}</h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">{description}</p>
      {digest ? (
        <p className="mt-2 font-mono text-[12px] text-[var(--ishbor-text-muted)]">
          {t('page_error_ref').replace('{id}', digest)}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            {retryLabel ?? t('retry')}
          </Button>
        ) : null}
        <Link href={PATHS.home}>
          <Button variant={onRetry ? 'outline' : 'primary'}>{t('nav_home')}</Button>
        </Link>
        <Link href={PATHS.services}>
          <Button variant="outline">{t('nav_services')}</Button>
        </Link>
      </div>
      <p className="mt-8 max-w-sm text-[13px] text-[var(--ishbor-text-muted)]">
        {t('page_error_support_hint')}{' '}
        <Link href={PATHS.help} className="font-medium text-[var(--color-primary)] hover:underline">
          {t('page_error_help')}
        </Link>
      </p>
    </main>
  )

  if (!showChrome) {
    return <div className="flex min-h-[60vh] flex-col">{body}</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--body-bg)]">
      <header className="border-b border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-3">
        <div className="layout-container flex max-w-[1280px] items-center justify-between gap-4">
          <AuthPageBrand href={PATHS.home} />
          <Link
            href={PATHS.help}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            {t('page_error_help')}
          </Link>
        </div>
      </header>
      {body}
    </div>
  )
}
