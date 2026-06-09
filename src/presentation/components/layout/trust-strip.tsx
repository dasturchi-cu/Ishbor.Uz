'use client'

import { Lock, Shield, Zap } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'

export function TrustStrip({ className }: { className?: string }) {
  const { t } = useApp()

  const items = [
    { icon: Shield, label: t('trust_escrow') },
    { icon: Lock, label: t('trust_commission') },
    { icon: Zap, label: t('trust_withdrawal') },
  ]

  return (
    <div className={className}>
      <ul className="trust-strip">
        {items.map(({ icon: Icon, label }) => (
          <li key={label} className="trust-strip-item">
            <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={2} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[var(--kwork-text-muted)]">{t('escrow_after_payment')}</p>
    </div>
  )
}
