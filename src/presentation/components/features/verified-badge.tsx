'use client'

import { BadgeCheck } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function VerifiedBadge({ className }: { className?: string }) {
  const { t } = useApp()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[var(--success-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--success-dark)]',
        className
      )}
      title={t('verified_badge')}
    >
      <BadgeCheck className="h-3 w-3" aria-hidden />
      {t('verified_badge')}
    </span>
  )
}
