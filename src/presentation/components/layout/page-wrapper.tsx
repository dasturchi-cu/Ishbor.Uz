'use client'

import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Breadcrumb, type BreadcrumbItem } from '@/presentation/components/layout/breadcrumb'

export interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
  breadcrumb?: BreadcrumbItem[]
}

export function PageWrapper({ children, className, fullWidth = false, breadcrumb }: PageWrapperProps) {
  return (
    <div
      className={cn(
        'page-wrapper layout-container pb-8 pt-6 md:pt-8',
        !fullWidth && 'max-w-[1280px]',
        className
      )}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} className="mb-4" />
      )}
      {children}
    </div>
  )
}