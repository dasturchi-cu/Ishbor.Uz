'use client'

import { Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function ReputationBadge({
  trustScore,
  className,
}: {
  trustScore?: number | null
  className?: string
}) {
  const { t } = useApp()
  if (trustScore == null || trustScore <= 0) return null

  const tone =
    trustScore >= 80 ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'text-[var(--ishbor-text-muted)] bg-[var(--neutral-100)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        tone,
        className
      )}
      title={t('reputation_trust_score')}
    >
      <Shield className="h-3 w-3" aria-hidden />
      {trustScore}
    </span>
  )
}
