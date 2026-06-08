'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'h-9 min-h-9 text-sm',
  md: 'h-10 min-h-[var(--input-h)] text-sm',
  lg: 'h-12 min-h-[var(--btn-h-lg)] text-base sm:text-sm',
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

    return (
      <div className="w-full min-w-0">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'input-field-wrapper relative rounded-[var(--r-md)] border bg-[var(--color-bg)] transition-[var(--transition)]',
            'focus-within:border-[var(--color-primary)] focus-within:shadow-[var(--shadow-focus)]',
            error
              ? 'border-[var(--error)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--error)_14%,transparent)]'
              : 'border-[var(--kwork-border)]',
            disabled && 'cursor-not-allowed bg-[var(--color-bg-subtle)] opacity-70'
          )}
        >
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[var(--color-text-muted)] [&>svg]:h-4 [&>svg]:w-4">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              'w-full border-0 bg-transparent px-3 text-[var(--color-text)] outline-none ring-0',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-0 focus:shadow-none',
              'disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              sizeStyles[inputSize],
              'input-touch text-base sm:text-sm',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] [&>svg]:h-4 [&>svg]:w-4">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 flex items-center gap-1 text-[12px] text-[var(--error)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
