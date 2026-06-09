'use client'

import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, disabled, ...props }, ref) => {
    const textareaId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'min-h-[100px] w-full resize-y rounded-[var(--r-md)] border bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-[var(--transition)] outline-none',
            'focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-[var(--error)] shadow-[0_0_0_3px_rgba(220,38,38,0.14)]'
              : 'border-[var(--ishbor-border)]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
