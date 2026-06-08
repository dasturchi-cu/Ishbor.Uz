'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { PATHS } from '@/domain/constants/routes'
import { saveWaitlistEmail } from '@/shared/lib/waitlist'
import { toast } from '@/presentation/components/ui/toast'

const PLANS = [
  {
    id: 'free',
    nameKey: 'pricing_free' as const,
    priceKey: 'pricing_free_price' as const,
    descKey: 'pricing_free_desc' as const,
    features: ['pricing_feat_profile', 'pricing_feat_services', 'pricing_feat_orders', 'pricing_feat_chat'] as const,
    ctaKey: 'register' as const,
    href: PATHS.register,
    highlighted: false,
  },
  {
    id: 'pro',
    nameKey: 'pricing_pro' as const,
    priceKey: 'pricing_pro_price' as const,
    descKey: 'pricing_pro_desc' as const,
    features: ['pricing_feat_featured', 'pricing_feat_analytics', 'pricing_feat_priority', 'pricing_feat_badge'] as const,
    ctaKey: 'pricing_pro_waitlist' as const,
    href: null,
    highlighted: true,
  },
] as const

export function PricingPage() {
  const { t } = useApp()
  const [proEmail, setProEmail] = useState('')

  const handleProWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = proEmail.trim()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t('newsletter_invalid_email'))
      return
    }
    const ok = await saveWaitlistEmail(trimmed, 'pro')
    if (ok) {
      toast.success(t('newsletter_thanks'))
      setProEmail('')
    } else {
      toast.error(t('newsletter_save_failed'))
    }
  }

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-bold text-[var(--kwork-text)] sm:text-[28px]">{t('nav_pricing')}</h1>
        <p className="mt-2 text-[14px] text-[var(--kwork-text-muted)]">{t('pricing_subtitle')}</p>
      </div>

      <div className="mx-auto grid max-w-[900px] gap-5 md:grid-cols-2">
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
            <h2 className="text-xl font-bold text-[var(--kwork-text)]">{t(plan.nameKey)}</h2>
            <p className="mt-1 text-[28px] font-bold text-[var(--color-primary)]">{t(plan.priceKey)}</p>
            <p className="mt-2 text-[14px] text-[var(--kwork-text-muted)]">{t(plan.descKey)}</p>
            {plan.id === 'pro' && (
              <p className="mt-2 text-[12px] font-medium text-[var(--warning-dark)]">{t('pricing_features_soon_note')}</p>
            )}
            {plan.id === 'free' && (
              <p className="mt-2 text-[12px] text-[var(--kwork-text-muted)]">{t('escrow_steps_disclaimer')}</p>
            )}
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((key) => (
                <li key={key} className="flex items-start gap-2 text-[14px] text-[var(--kwork-text-sub)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  {t(key)}
                </li>
              ))}
            </ul>
            {plan.href ? (
              <Link href={plan.href} className="mt-8 block">
                <Button variant={plan.highlighted ? 'primary' : 'outline'} fullWidth>
                  {t(plan.ctaKey)}
                </Button>
              </Link>
            ) : (
              <form onSubmit={handleProWaitlist} className="mt-8 flex flex-col gap-2">
                <Input
                  type="email"
                  value={proEmail}
                  onChange={(e) => setProEmail(e.target.value)}
                  placeholder={t('footer_newsletter_placeholder')}
                />
                <Button type="submit" variant="primary" fullWidth>
                  {t(plan.ctaKey)}
                </Button>
              </form>
            )}
          </article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[560px] text-center text-[13px] text-[var(--kwork-text-muted)]">
        {t('wallet_payment_note')}
      </p>
    </PageWrapper>
  )
}
