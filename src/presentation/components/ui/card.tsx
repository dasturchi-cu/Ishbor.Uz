'use client'

import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'featured' | 'danger'
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'border border-[var(--color-border)] shadow-[var(--shadow-card)]',
  interactive:
    'border border-[var(--color-border)] shadow-[var(--shadow-card)] cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-px',
  featured:
    'border border-[var(--color-primary)] shadow-[var(--shadow-md)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]',
  danger: 'border border-[var(--error-bg)] shadow-[var(--shadow-card)]',
}

export function Card({
  variant = 'default',
  interactive = false,
  padding = 'md',
  className,
  children,
  onClick,
  ...props
}: CardProps) {
  const resolvedVariant = interactive || onClick ? 'interactive' : variant
  const isClickable = Boolean(onClick) || interactive

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        'rounded-[var(--r-card)] bg-[var(--neutral-0)] text-left transition-[var(--transition)] duration-200',
        variantStyles[resolvedVariant],
        paddingStyles[padding],
        isClickable && 'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex flex-col gap-1', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[18px] font-semibold leading-snug text-[var(--color-text)]', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[14px] text-[var(--color-text-sub)]', className)} {...props} />
  )
}

export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ml-auto shrink-0', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 flex items-center border-t border-[var(--color-border)] pt-4',
        className
      )}
      {...props}
    />
  )
}
