'use client'

import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'info'
}

export function Alert({
  variant = 'error',
  className,
  children,
  role,
  ...props
}: AlertProps) {
  return (
    <div
      role={role ?? (variant === 'success' ? 'status' : 'alert')}
      className={cn('ui-alert', `ui-alert--${variant}`, className)}
      {...props}
    >
      {children}
    </div>
  )
}
