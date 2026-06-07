'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  success?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  required,
  disabled,
  className,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === 'password'

  return (
    <div className={cn('w-full space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg transition-all',
            'bg-input text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            error && 'border-destructive focus:ring-destructive',
            success && 'border-green-500 focus:ring-green-500',
            !error && !success && 'border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Status icons */}
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
        {success && !error && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Success message */}
      {success && !error && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Mavaffaqiyatli to'ldirildi
        </p>
      )}
    </div>
  )
}

interface FormErrorProps {
  message: string
  icon?: ReactNode
}

export function FormError({ message, icon }: FormErrorProps) {
  return (
    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
      {icon || <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

interface FormSuccessProps {
  message: string
  icon?: ReactNode
}

export function FormSuccess({ message, icon }: FormSuccessProps) {
  return (
    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
      {icon || <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
      <p className="text-sm text-green-700">{message}</p>
    </div>
  )
}
