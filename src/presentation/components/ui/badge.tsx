'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'outline' | 'dark'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  onRemove?: () => void
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--color-bg-muted)] text-[var(--color-text-sub)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-dark)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  error: 'bg-[var(--error-bg)] text-[var(--error-dark)]',
  info: 'bg-[var(--info-bg)] text-[var(--brand-700)]',
  primary: 'bg-[var(--brand-100)] text-[var(--color-primary-text)]',
  outline: 'border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-sub)]',
  dark: 'bg-[var(--neutral-800)] text-[var(--neutral-100)]',
}

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[11px]',
  sm: 'px-2 py-0.5 text-[12px]',
  md: 'px-2.5 py-1 text-[13px]',
}

export function Badge({
  variant = 'default',
  size = 'sm',
  dot,
  onRemove,
  className,
  children,
  ...props
}: BadgeProps) {
  const { t } = useApp()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--r-full)] font-medium leading-tight transition-[var(--transition)]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded-full p-0.5 opacity-70 hover:opacity-100"
          aria-label={t('remove')}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
