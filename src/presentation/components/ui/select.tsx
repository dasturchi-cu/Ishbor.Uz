'use client'

import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Native select ignores padding-right in some browsers — chevron via background, not overlay */
const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  inputSize?: 'sm' | 'md' | 'lg'
  options: { value: string; label: string }[]
  placeholder?: string
  leftIcon?: React.ReactNode
  wrapperClassName?: string
}

const sizeStyles = {
  sm: 'h-9 min-h-9 text-[13px]',
  md: 'h-10 min-h-[var(--input-h)] text-[13px]',
  lg: 'h-12 min-h-[var(--btn-h-lg)] text-sm',
}

export function Select({
  label,
  error,
  hint,
  inputSize = 'md',
  options,
  placeholder,
  leftIcon,
  wrapperClassName,
  className,
  id,
  disabled,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  return (
    <div
      className={cn(
        'min-w-0',
        label || hint || error ? 'w-full' : 'inline-block',
        wrapperClassName
      )}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--ishbor-text-muted)]">
            {leftIcon}
          </span>
        )}
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full min-w-0 cursor-pointer appearance-none rounded-[var(--r-md)] border font-medium text-[var(--ishbor-text)] ishbor-select',
            leftIcon && 'ishbor-select--icon-left',
            'transition-[var(--transition)] outline-none',
            'hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--ishbor-border))]',
            'focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-[var(--error)] shadow-[0_0_0_3px_rgba(220,38,38,0.14)]'
              : 'border-[var(--ishbor-border)] shadow-[var(--shadow-xs)]',
            sizeStyles[inputSize],
            className
          )}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            backgroundImage: CHEVRON_BG,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px 16px',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}
