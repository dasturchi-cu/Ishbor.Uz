'use client'

import { CreditCard, Shield, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'
import type { TranslationKey } from '@/infrastructure/i18n'

const STEPS: { icon: typeof Shield; labelKey: TranslationKey }[] = [
  { icon: CreditCard, labelKey: 'escrow_step_pay' },
  { icon: Shield, labelKey: 'escrow_step_hold' },
  { icon: CheckCircle2, labelKey: 'escrow_step_release' },
]

/** IshBor signature — himoyalangan to'lov 3 bosqichli strip */
export function IshborProtectionStrip({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useApp()

  return (
    <div className={cn('ishbor-protection-strip', compact && 'ishbor-protection-strip--compact', className)}>
      <div className="ishbor-protection-strip__badge">
        <Shield className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('protected_payment_label')}</span>
      </div>
      <ol className="ishbor-protection-strip__steps" aria-label={t('protected_payment_label')}>
        {STEPS.map(({ icon: Icon, labelKey }, i) => (
          <li key={labelKey} className="ishbor-protection-strip__step">
            <span className="ishbor-protection-strip__step-icon" aria-hidden>
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="ishbor-protection-strip__step-label">{t(labelKey)}</span>
            {i < STEPS.length - 1 && (
              <span className="ishbor-protection-strip__connector" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
