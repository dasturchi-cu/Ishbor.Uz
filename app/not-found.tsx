'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'

export default function NotFound() {
  const { t } = useApp()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[72px] font-black leading-none text-[var(--color-primary)]/20">404</p>
      <h1 className="mt-4 text-[24px] font-bold text-[var(--ishbor-text)]">{t('not_found_title')}</h1>
      <p className="mt-2 max-w-md text-[14px] text-[var(--ishbor-text-muted)]">{t('not_found_desc')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={PATHS.home}>
          <Button variant="primary">{t('nav_home')}</Button>
        </Link>
        <Link href={PATHS.services}>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            {t('nav_services')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
