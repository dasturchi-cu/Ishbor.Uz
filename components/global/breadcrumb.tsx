'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn('flex items-center gap-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={cn(
                'transition-colors',
                item.active
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {item.label}
            </button>
          ) : (
            <span
              className={cn(
                'transition-colors',
                item.active
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
