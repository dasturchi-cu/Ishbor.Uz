'use client'

import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type ProductPageWidth = 'default' | 'wide' | 'narrow'

export function ProductPage({
  children,
  className,
  width = 'default',
}: {
  children: ReactNode
  className?: string
  width?: ProductPageWidth
}) {
  return (
    <div
      className={cn(
        'ps-page',
        width === 'wide' && 'ps-page--wide',
        width === 'narrow' && 'ps-page--narrow',
        className
      )}
    >
      {children}
    </div>
  )
}

export function ProductPageHeader({
  title,
  description,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <header className={cn('ps-page-header', className)}>
      <h1 className="ps-title">{title}</h1>
      {description ? <p className="ps-desc">{description}</p> : null}
      {children}
    </header>
  )
}

export function ProductHero({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  return (
    <section className={cn('ps-hero', className)} aria-label={ariaLabel}>
      {children}
    </section>
  )
}

export function ProductFocus({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('ps-focus', className)}>
      {children}
    </section>
  )
}

export function ProductSplit({
  main,
  aside,
  className,
}: {
  main: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('ps-split', className)}>
      <div className="ps-split-main">{main}</div>
      {aside ? <aside className="ps-split-aside">{aside}</aside> : null}
    </div>
  )
}

export function ProductAsideCard({
  id,
  title,
  icon,
  children,
  flat,
  className,
}: {
  id?: string
  title: string
  icon?: ReactNode
  children: ReactNode
  flat?: boolean
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn('ps-aside-card', flat && 'ps-aside-card--flat', className)}
    >
      <div className="ps-aside-card__head">
        <h2 className="ps-aside-card__title">{title}</h2>
        {icon}
      </div>
      {children}
    </section>
  )
}

export function ProductPanel({
  title,
  link,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  title: string
  link?: ReactNode
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  return (
    <section className={cn('ps-panel', className)} aria-label={ariaLabel}>
      <div className="ps-panel__head">
        <h2 className="ps-panel__title">{title}</h2>
        {link}
      </div>
      {children}
    </section>
  )
}
