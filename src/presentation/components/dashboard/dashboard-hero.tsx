'use client'

import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import type { ApiOrder } from '@/infrastructure/api/types'
import type { OnboardingProgress } from '@/shared/lib/onboarding-progress'

interface DashboardHeroProps {
  role: 'freelancer' | 'client'
  activeOrders: number
  pendingPayments: number
  messageUnread: number
  walletBalance?: number | null
  primaryCta: { label: string; href: string }
  orders: ApiOrder[]
  onboardingProgress?: OnboardingProgress | null
}

export function DashboardHero({
  role,
  activeOrders,
  pendingPayments,
  messageUnread,
  walletBalance,
  primaryCta,
  onboardingProgress,
}: DashboardHeroProps) {
  const { t, profile } = useApp()
  const firstName = profile?.full_name?.split(/\s+/)[0]

  const focalMessage =
    pendingPayments > 0
      ? t('dash_focal_pay').replace('{n}', String(pendingPayments))
      : activeOrders > 0
        ? t('dash_focal_orders').replace('{n}', String(activeOrders))
        : role === 'client'
          ? t('client_dashboard')
          : t('freelancer_dashboard_sub')

  const showOnboarding =
    onboardingProgress && !onboardingProgress.complete && onboardingProgress.percent < 100

  return (
    <section className="dash-hero">
      <div className="dash-hero__main">
        <div className="dash-hero__copy min-w-0">
          <h2 className="dash-hero__title">
            {firstName ? `${t('welcome_back_short')}, ${firstName}` : t('welcome_back_short')}
          </h2>
          <p className="dash-hero__focal">{focalMessage}</p>

          {showOnboarding && (
            <Link href={PATHS.dashboardProfile} className="dash-hero__onboarding">
              <div className="dash-hero__onboarding-head">
                <span>{t('onboarding_first_steps')}</span>
                <span className="tabular-nums">
                  {onboardingProgress.done}/{onboardingProgress.total}
                </span>
              </div>
              <div
                className="dash-hero__onboarding-bar"
                role="progressbar"
                aria-valuenow={onboardingProgress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('onboarding_first_steps')}
              >
                <span style={{ width: `${onboardingProgress.percent}%` }} />
              </div>
            </Link>
          )}

          <div className="dash-hero__metrics">
            <div className="dash-hero__metric">
              <span className="dash-hero__metric-value">{activeOrders}</span>
              <span className="dash-hero__metric-label">{t('dash_kpi_active_orders')}</span>
            </div>
            {messageUnread > 0 && (
              <Link href={PATHS.dashboardMessages} className="dash-hero__metric hover:opacity-80">
                <span className="dash-hero__metric-value">{messageUnread}</span>
                <span className="dash-hero__metric-label">{t('dash_kpi_new_messages')}</span>
              </Link>
            )}
            {walletBalance != null && walletBalance > 0 && (
              <Link href={PATHS.dashboardWallet} className="dash-hero__metric hover:opacity-80">
                <span className="dash-hero__metric-value">{formatPrice(walletBalance)}</span>
                <span className="dash-hero__metric-label">{t('dash_kpi_wallet')}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="dash-hero__cta shrink-0">
          <Link href={primaryCta.href}>
            <Button variant="primary" size="md" className="w-full rounded-[var(--r-md)] sm:w-auto sm:min-w-[180px]">
              {primaryCta.label}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
