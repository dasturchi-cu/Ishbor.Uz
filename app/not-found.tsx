'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { AuthPageBrand } from '@/presentation/components/layout/brand-logo'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'

export default function NotFound() {
  const { t } = useApp()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--body-bg)]">
      <header className="border-b border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-3">
        <div className="layout-container flex max-w-[1280px] items-center justify-between gap-4">
          <AuthPageBrand href={PATHS.home} />
          <Link
            href={PATHS.help}
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            {t('page_error_help')}
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center outline-none"
      >
        <p className="text-[72px] font-black leading-none text-[var(--color-primary)]/20" aria-hidden>
          404
        </p>
        <h1 className="mt-4 text-[24px] font-bold text-[var(--ishbor-text)]">{t('not_found_title')}</h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
          {t('not_found_desc')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={PATHS.home}>
            <Button variant="primary">{t('nav_home')}</Button>
          </Link>
          <Link href={PATHS.services}>
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" aria-hidden />
              {t('nav_services')}
            </Button>
          </Link>
          <Link href={PATHS.freelancers}>
            <Button variant="outline">{t('nav_freelancers')}</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
