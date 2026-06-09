'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'

const PLANS = [
  {
    id: 'free',
    nameKey: 'pricing_free' as const,
    priceKey: 'pricing_free_price' as const,
    descKey: 'pricing_free_desc' as const,
    features: ['pricing_feat_profile', 'pricing_feat_services', 'pricing_feat_orders', 'pricing_feat_chat'] as const,
    ctaKey: 'register' as const,
    href: PATHS.register,
    highlighted: true,
  },
] as const

export function PricingPage() {
  const { t } = useApp()

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-bold text-[var(--ishbor-text)] sm:text-[28px]">{t('nav_pricing')}</h1>
        <p className="mt-2 text-[14px] text-[var(--ishbor-text-muted)]">{t('pricing_subtitle')}</p>
      </div>

      <div className="mx-auto grid max-w-[480px] gap-5">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`surface-panel flex flex-col p-6 sm:p-8 ${plan.highlighted ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
          >
            {plan.highlighted && (
              <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {t('pricing_popular')}
              </span>
            )}
            <h2 className="text-xl font-bold text-[var(--ishbor-text)]">{t(plan.nameKey)}</h2>
            <p className="mt-1 text-[28px] font-bold text-[var(--color-primary)]">{t(plan.priceKey)}</p>
            <p className="mt-2 text-[14px] text-[var(--ishbor-text-muted)]">{t(plan.descKey)}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((key) => (
                <li key={key} className="flex items-start gap-2 text-[14px] text-[var(--ishbor-text-sub)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="mt-8 block">
              <Button variant="primary" fullWidth>
                {t(plan.ctaKey)}
              </Button>
            </Link>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-[560px] flex-col items-center gap-3 text-center">
        <Link href={PATHS.services}>
          <Button variant="outline" size="sm">
            {t('browse_services')}
          </Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
