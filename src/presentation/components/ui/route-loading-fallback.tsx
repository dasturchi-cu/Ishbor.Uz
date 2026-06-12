'use client'

import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function RouteLoadingFallback({ className }: { className?: string }) {
  const { t } = useApp()
  return <div className={cn('text-muted-foreground', className)}>{t('loading')}</div>
}
