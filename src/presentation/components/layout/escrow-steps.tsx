'use client'

import { CheckCircle2, CreditCard, Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'

export function EscrowSteps({ className }: { className?: string }) {
  const { t } = useApp()

  const steps = [
    { icon: CreditCard, titleKey: 'escrow_step_pay' as const, descKey: 'escrow_step_pay_desc' as const },
    { icon: Shield, titleKey: 'escrow_step_hold' as const, descKey: 'escrow_step_hold_desc' as const },
    { icon: CheckCircle2, titleKey: 'escrow_step_release' as const, descKey: 'escrow_step_release_desc' as const },
  ]

  return (
    <div className={className}>
      <div className="escrow-steps">
        {steps.map(({ icon: Icon, titleKey, descKey }, i) => (
          <div key={titleKey} className="escrow-step">
            <div className="escrow-step-icon">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="escrow-step-body">
              <p className="escrow-step-title">{t(titleKey)}</p>
              <p className="escrow-step-desc">{t(descKey)}</p>
            </div>
            {i < steps.length - 1 && <span className="escrow-step-connector hide-mobile" aria-hidden />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--kwork-text-muted)]">
        {t('escrow_steps_disclaimer')}
      </p>
    </div>
  )
}
