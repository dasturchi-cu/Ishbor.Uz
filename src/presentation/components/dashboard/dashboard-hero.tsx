'use client'

import Link from 'next/link'
import {
  Bell,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS, dashboardOrderPath } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { ApiOrder } from '@/infrastructure/api/types'
import type { OnboardingProgress } from '@/shared/lib/onboarding-progress'

interface DashboardHeroProps {
  role: 'freelancer' | 'client'
  activeOrders: number
  pendingPayments: number
  messageUnread: number
  notificationUnread?: number
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
  notificationUnread = 0,
  walletBalance,
  primaryCta,
  orders,
  onboardingProgress,
}: DashboardHeroProps) {
  const { t, profile } = useApp()
  const firstName = profile?.full_name?.split(/\s+/)[0]
  const completion = profileCompletionPercent(profile, role)
  const isVerified = profile?.is_verified

  const kpis = [
    {
      id: 'orders',
      icon: ShoppingBag,
      label: t('dash_kpi_active_orders'),
      value: String(activeOrders),
      href: PATHS.dashboardOrders,
      tone: activeOrders > 0 ? 'primary' : 'muted',
    },
    {
      id: 'payments',
      icon: CreditCard,
      label: t('dash_kpi_pending_payments'),
      value: String(pendingPayments),
      href:
        pendingPayments > 0
          ? dashboardOrderPath(
              orders.find((o) => o.status === 'pending' && o.payment_status !== 'held')?.id ??
                orders[0]?.id ??
                ''
            )
          : PATHS.dashboardPayments,
      tone: pendingPayments > 0 ? 'warning' : 'muted',
    },
    {
      id: 'messages',
      icon: MessageCircle,
      label: t('dash_kpi_new_messages'),
      value: messageUnread > 0 ? String(messageUnread) : '0',
      href: PATHS.dashboardMessages,
      tone: messageUnread > 0 ? 'success' : 'muted',
    },
    {
      id: 'wallet',
      icon: Wallet,
      label: t('dash_kpi_wallet'),
      value: walletBalance != null ? formatPrice(walletBalance) : '—',
      href: PATHS.dashboardWallet,
      tone: walletBalance != null && walletBalance > 0 ? 'primary' : 'muted',
    },
    {
      id: 'notifications',
      icon: Bell,
      label: t('dash_kpi_notifications'),
      value: notificationUnread > 0 ? String(notificationUnread) : '0',
      href: PATHS.notifications,
      tone: notificationUnread > 0 ? 'warning' : 'muted',
    },
  ] as const

  return (
    <section className="dash-hero">
      <div className="dash-hero__main">
        <div className="dash-hero__copy">
          <p className="dash-hero__eyebrow">{t('dash_greeting')}</p>
          <h2 className="dash-hero__title">
            {firstName ? `${t('welcome_back_short')}, ${firstName}` : t('welcome_back_short')}
          </h2>
          <p className="dash-hero__sub">{role === 'client' ? t('client_dashboard') : t('freelancer_dashboard_sub')}</p>
          <div className="dash-hero__chips">
            <span className={cn('dash-chip', isVerified ? 'dash-chip--verified' : 'dash-chip--muted')}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {isVerified ? t('badge_verified') : t('dash_verify_pending')}
            </span>
            {completion < 100 && (
              <span className="dash-chip dash-chip--progress">
                <TrendingUp className="h-3.5 w-3.5" />
                {t('profile_completion').replace('{n}', String(completion))}
              </span>
            )}
          </div>
          {onboardingProgress && !onboardingProgress.complete && (
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
        </div>
        <div className="dash-hero__cta">
          <Link href={primaryCta.href}>
            <Button variant="primary" size="md" className="w-full rounded-full sm:w-auto" leftIcon={<Sparkles className="h-4 w-4" />}>
              {primaryCta.label}
            </Button>
          </Link>
        </div>
      </div>

      <div className="dash-hero__kpis dash-hero__kpis--5">
        {kpis.map(({ id, icon: Icon, label, value, href, tone }) => (
          <Link key={id} href={href} className={cn('dash-kpi', `dash-kpi--${tone}`)}>
            <span className="dash-kpi__icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="dash-kpi__value">{value}</span>
            <span className="dash-kpi__label">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
