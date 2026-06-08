'use client'

import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export interface HeaderLogoProps {
  href: string
  tagline?: string
  className?: string
  compact?: boolean
  /** Auth header: logo va tagline bir qatorda */
  layout?: 'stacked' | 'inline'
}

function LogoMark({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        'relative font-bold tracking-[-0.03em] text-[var(--kwork-text)]',
        compact ? 'text-[18px]' : 'text-[20px] sm:text-[22px]'
      )}
    >
      <span
        className="absolute left-0 top-0 h-2 w-2 bg-[var(--warning)]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        aria-hidden
      />
      ISH
      <span className="text-[var(--color-primary)]">BOR</span>
    </span>
  )
}

export function HeaderLogo({ href, tagline, className, compact, layout = 'stacked' }: HeaderLogoProps) {
  if (layout === 'inline') {
    return (
      <Link href={href} className={cn('header-logo-inline shrink-0', className)}>
        <LogoMark compact={compact} />
        {tagline && !compact && (
          <span className="header-logo-inline-tagline">{tagline}</span>
        )}
      </Link>
    )
  }

  return (
    <Link href={href} className={cn('flex shrink-0 flex-col leading-none', className)}>
      <LogoMark compact={compact} />
      {tagline && !compact && (
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--kwork-text-muted)] sm:text-[11px]">
          {tagline}
        </span>
      )}
    </Link>
  )
}
