'use client'

import Link from 'next/link'
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
        {trustLine ? <p className="marketplace-catalog-hero__trust">{trustLine}</p> : null}
      </div>
    </section>
  )
}
