'use client'

import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export type BrandLogoVariant = 'header' | 'auth-page' | 'auth-panel' | 'footer'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  href?: string
  className?: string
  compact?: boolean
}

function BrandWordmark({ variant, compact }: { variant: BrandLogoVariant; compact?: boolean }) {
  if (variant === 'header') {
    return (
      <span
        className={cn(
          'relative font-bold tracking-[-0.03em] text-[var(--ishbor-text)]',
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

  if (variant === 'auth-panel') {
    return (
      <>
        <span className="auth-brand-logo__mark" aria-hidden />
        ISH<span className="auth-brand-logo__accent">BOR</span>
      </>
    )
  }

  if (variant === 'footer') {
    return (
      <>
        IshBor<span>.uz</span>
      </>
    )
  }

  return (
    <>
      <span className="auth-page-brand__mark" aria-hidden />
      ISH<span>BOR</span>
    </>
  )
}

export function BrandLogo({ variant = 'header', href, className, compact }: BrandLogoProps) {
  const inner = <BrandWordmark variant={variant} compact={compact} />

  if (!href) {
    return variant === 'header' ? inner : <span className={className}>{inner}</span>
  }

  const linkClass =
    variant === 'auth-panel'
      ? cn('auth-brand-logo', className)
      : variant === 'auth-page'
        ? cn('auth-page-brand__logo', className)
        : variant === 'footer'
          ? cn('footer-logo', className)
          : className

  return (
    <Link href={href} className={linkClass}>
      {inner}
    </Link>
  )
}

export function AuthPageBrand({ href }: { href: string }) {
  return (
    <div className="auth-page-brand">
      <BrandLogo variant="auth-page" href={href} />
    </div>
  )
}
