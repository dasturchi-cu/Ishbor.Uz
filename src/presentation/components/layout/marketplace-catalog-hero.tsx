'use client'

import Link from 'next/link'
import { BadgeCheck, Lock, Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { cn } from '@/shared/lib/utils'

type HeroAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'outline'
}

type MarketplaceCatalogHeroProps = {
  badge: string
  title: string
  subtitle: string
  primaryAction?: HeroAction
  secondaryAction?: HeroAction
  trustLine?: string
  className?: string
}

function HeroActionButton({ action }: { action: HeroAction }) {
  const variant = action.variant ?? 'primary'
  if (action.href) {
    return (
      <Link href={action.href}>
        <Button variant={variant}>{action.label}</Button>
      </Link>
    )
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  )
}

export function MarketplaceCatalogHero({
  badge,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  trustLine,
  className,
}: MarketplaceCatalogHeroProps) {
  const { t } = useApp()

  return (
    <section className={cn('marketplace-catalog-hero', className)}>
      <div className="layout-container max-w-[1280px]">
        <span className="landing-hero-badge">{badge}</span>
        <h1 className="marketplace-catalog-hero__title">{title}</h1>
        <p className="marketplace-catalog-hero__subtitle">{subtitle}</p>
        {(primaryAction || secondaryAction) && (
          <div className="marketplace-catalog-hero__actions">
            {primaryAction ? <HeroActionButton action={primaryAction} /> : null}
            {secondaryAction ? (
              <HeroActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? 'outline' }} />
            ) : null}
          </div>
        )}
        {trustLine ? (
          <div className="marketplace-hero-trust-row" role="list" aria-label={trustLine}>
            <span className="marketplace-hero-trust-badge" role="listitem">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              {trustLine}
            </span>
            <span className="marketplace-hero-trust-badge" role="listitem">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              {t('trust_item_cert')}
            </span>
            <span className="marketplace-hero-trust-badge" role="listitem">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {t('trust_escrow')}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
