'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS, regionSlug } from '@/domain/constants/regions'

export function RegionsIndexPage() {
  const { t } = useApp()

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-8">
      <div className="mx-auto max-w-[720px] text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <MapPin className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-[26px] font-bold text-[var(--ishbor-text)] sm:text-[32px]">
          {t('region_seo_all_regions')}
        </h1>
      </div>

      <section className="mx-auto mt-10 max-w-[960px]">
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {UZ_REGIONS.map((region) => (
            <li key={region}>
              <Link
                href={PATHS.regionLanding(regionSlug(region))}
                className="surface-panel block rounded-xl px-4 py-3 text-[14px] transition-colors hover:border-[var(--color-primary)]"
              >
                {region}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageWrapper>
  )
}
