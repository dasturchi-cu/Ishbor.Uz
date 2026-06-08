'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-none hover:bg-[var(--color-primary-hover)] hover:shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] active:bg-[var(--color-primary-active)] disabled:bg-[var(--color-primary-disabled-bg)] disabled:text-[var(--color-primary-disabled-text)] disabled:opacity-100',
  default:
    'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-none hover:bg-[var(--color-primary-hover)] hover:shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] active:bg-[var(--color-primary-active)] disabled:bg-[var(--color-primary-disabled-bg)] disabled:text-[var(--color-primary-disabled-text)] disabled:opacity-100',
  secondary:
    'bg-[var(--color-bg-muted)] text-[var(--neutral-700)] hover:bg-[var(--color-border)] active:scale-[0.98]',
  outline:
    'bg-transparent border border-[var(--color-border-strong)] text-[var(--neutral-700)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--neutral-400)] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--color-text-sub)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--neutral-700)] active:scale-[0.98]',
  danger:
    'border border-[#B91C1C] bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] hover:text-white active:scale-[0.98]',
  destructive:
    'border border-[#B91C1C] bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] hover:text-white active:scale-[0.98]',
  link:
    'bg-transparent p-0 h-auto text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline active:scale-100 shadow-none',
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 min-h-[var(--btn-h-sm)] px-3 text-[13px] rounded-[var(--r-sm)] [&_svg]:h-3.5 [&_svg]:w-3.5',
  md: 'h-10 min-h-[var(--btn-h-md)] px-4 text-[14px] rounded-[var(--r-md)] [&_svg]:h-4 [&_svg]:w-4',
  default: 'h-10 min-h-[var(--btn-h-md)] px-4 text-[14px] rounded-[var(--r-md)] [&_svg]:h-4 [&_svg]:w-4',
  lg: 'h-12 min-h-[var(--btn-h-lg)] px-6 text-[15px] rounded-[var(--r-md)] [&_svg]:h-[18px] [&_svg]:w-[18px]',
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px] p-0 rounded-[var(--r-md)] [&_svg]:h-4 [&_svg]:w-4',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const resolvedVariant = variant === 'default' ? 'primary' : variant === 'destructive' ? 'danger' : variant
  const resolvedSize = size === 'default' ? 'md' : size
  const isLink = resolvedVariant === 'link'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-[var(--transition)]',
        !isLink && 'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        resolvedVariant !== 'primary' && 'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
        variantStyles[resolvedVariant],
        !isLink && sizeStyles[resolvedSize],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

/** @deprecated use Button with variant prop */
export const buttonVariants = () => ''
