'use client'

import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS, regionSlug, type UzRegion } from '@/domain/constants/regions'

type Props = {
  region: UzRegion
}

function regionQuery(region: string): string {
  return encodeURIComponent(region)
}

export function RegionLandingPage({ region }: Props) {
  const { t } = useApp()
  const title = t('region_seo_title').replace('{region}', region)
  const description = t('region_seo_desc').replace('{region}', region)
  const servicesHref = `${PATHS.services}?region=${regionQuery(region)}`
  const freelancersHref = `${PATHS.freelancers}?region=${regionQuery(region)}`

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-8">
      <div className="mx-auto max-w-[720px] text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <MapPin className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-[26px] font-bold text-[var(--ishbor-text)] sm:text-[32px]">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--ishbor-text-muted)]">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={servicesHref}>
            <Button variant="primary" size="lg">
              {t('region_seo_cta_services')}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link href={freelancersHref}>
            <Button variant="outline" size="lg">
              {t('region_seo_cta_freelancers')}
            </Button>
          </Link>
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-[960px]">
        <h2 className="mb-4 text-center text-[18px] font-semibold text-[var(--ishbor-text)]">
          {t('region_seo_all_regions')}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {UZ_REGIONS.map((r) => (
            <li key={r}>
              <Link
                href={PATHS.regionLanding(regionSlug(r))}
                className={`surface-panel block rounded-xl px-4 py-3 text-[14px] transition-colors hover:border-[var(--color-primary)] ${
                  r === region
                    ? 'border-[var(--color-primary)] font-semibold text-[var(--color-primary)]'
                    : 'text-[var(--ishbor-text-sub)]'
                }`}
              >
                {r}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageWrapper>
  )
}
