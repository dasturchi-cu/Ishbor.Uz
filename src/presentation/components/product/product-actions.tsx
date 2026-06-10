'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function ProductBtn({
  children,
  className,
  variant = 'primary',
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'outline' }) {
  return (
    <button
      type="button"
      className={cn(
        'ps-btn',
        variant === 'primary' && 'ps-btn--primary',
        variant === 'outline' && 'ps-btn--outline',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function ProductBtnLink({
  href,
  children,
  className,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  className?: string
  variant?: 'primary' | 'outline'
}) {
  return (
    <Link
      href={href}
      className={cn(
        'ps-btn',
        variant === 'primary' && 'ps-btn--primary',
        variant === 'outline' && 'ps-btn--outline',
        className
      )}
    >
      {children}
    </Link>
  )
}

export function ProductTextLink({
  children,
  className,
  ...props
}: ComponentProps<'button'>) {
  return (
    <button type="button" className={cn('ps-text-link', className)} {...props}>
      {children}
    </button>
  )
}

export function ProductTextLinkAnchor({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={cn('ps-text-link', className)}>
      {children}
    </Link>
  )
}
