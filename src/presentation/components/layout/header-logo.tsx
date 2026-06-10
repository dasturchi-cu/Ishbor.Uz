'use client'

import Link from 'next/link'
import { BrandLogo } from '@/presentation/components/layout/brand-logo'
import { cn } from '@/shared/lib/utils'

export interface HeaderLogoProps {
  href: string
  tagline?: string
  className?: string
  compact?: boolean
  /** Auth header: logo va tagline bir qatorda */
  layout?: 'stacked' | 'inline'
}

export function HeaderLogo({ href, tagline, className, compact, layout = 'stacked' }: HeaderLogoProps) {
  if (layout === 'inline') {
    return (
      <Link href={href} className={cn('header-logo-inline shrink-0', className)}>
        <BrandLogo variant="header" compact={compact} />
      {tagline && !compact && (
        <span className="header-logo-inline-tagline text-[11px] font-medium normal-case tracking-normal text-[var(--ishbor-text-muted)]">
          {tagline}
        </span>
      )}
      </Link>
    )
  }

  return (
    <Link href={href} className={cn('flex shrink-0 flex-col leading-none', className)}>
      <BrandLogo variant="header" compact={compact} />
      {tagline && !compact && (
        <span className="mt-0.5 text-[11px] font-medium normal-case tracking-normal text-[var(--ishbor-text-muted)]">
          {tagline}
        </span>
      )}
    </Link>
  )
}
