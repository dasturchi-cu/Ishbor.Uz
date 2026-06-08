'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import type { TranslationKey } from '@/infrastructure/i18n'
import type { PaymentCheckoutPhase, PaymentProvider } from '@/domain/constants/payment-checkout'
import {
  prefersLiveCheckout,
  resolveAvailableProviders,
} from '@/domain/constants/payment-checkout'
import { api } from '@/infrastructure/api/client'
import type { ApiPaymentsConfig } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { CreditCard, Loader2 } from 'lucide-react'

const STEPS: { phase: PaymentCheckoutPhase; labelKey: TranslationKey; liveOnly?: boolean }[] = [
  { phase: 'preparing', labelKey: 'payment_checkout_pending' },
  { phase: 'redirecting', labelKey: 'payment_checkout_redirect', liveOnly: true },
  { phase: 'processing', labelKey: 'payment_checkout_processing' },
  { phase: 'succeeded', labelKey: 'payment_checkout_succeeded' },
]

function stepIndex(phase: PaymentCheckoutPhase, isLiveProvider: boolean): number {
  if (phase === 'idle') return -1
  if (phase === 'failed') return 3
  if (phase === 'preparing') return 0
  if (phase === 'redirecting') return isLiveProvider ? 1 : 0
  if (phase === 'processing') return isLiveProvider ? 2 : 1
  if (phase === 'succeeded') return isLiveProvider ? 3 : 2
  return -1
}

function visibleSteps(isLiveProvider: boolean) {
  return isLiveProvider ? STEPS : STEPS.filter((s) => !s.liveOnly)
}

export function PaymentCheckoutFlow({
  phase,
  provider,
  isBusy,
  amountLabel,
  onPay,
  onRetry,
}: {
  phase: PaymentCheckoutPhase
  provider: PaymentProvider | null
  isBusy: boolean
  amountLabel: string
  onPay: (provider: PaymentProvider) => void
  onRetry: () => void
}) {
  const { t } = useApp()
  const [paymentsConfig, setPaymentsConfig] = useState<ApiPaymentsConfig | null>(null)

  useEffect(() => {
    let cancelled = false
    api.paymentsConfig().then((cfg) => {
      if (!cancelled) setPaymentsConfig(cfg)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const paymentsLive = prefersLiveCheckout(paymentsConfig)
  const providers = resolveAvailableProviders(paymentsConfig)
  const isLiveProvider = provider === 'click' || provider === 'payme'
  const steps = visibleSteps(isLiveProvider || phase === 'redirecting')
  const current = stepIndex(phase, isLiveProvider || phase === 'redirecting')
  const showButtons = phase === 'idle' || phase === 'failed'

  return (
    <div className="space-y-3">
      {phase !== 'idle' && (
        <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
          {steps.map((step, i) => {
            const done = current > i
            const active = current === i
            const failed = phase === 'failed' && i === steps.length - 1
            const labelKey =
              failed ? ('payment_checkout_failed' as TranslationKey) : step.labelKey

            return (
              <li key={step.phase} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                      done && !failed && 'bg-[var(--color-primary)] text-white',
                      active && !failed && 'border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                      failed && active && 'border-2 border-[var(--error)] bg-[var(--error-bg)] text-[var(--error-dark)]',
                      !done && !active && 'bg-[var(--color-bg-muted)] text-[var(--kwork-text-muted)]',
                    )}
                  >
                    {active && isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'text-[12px] font-medium sm:text-[13px]',
                      (done || active) ? 'text-[var(--kwork-text)]' : 'text-[var(--kwork-text-muted)]',
                      failed && active && 'text-[var(--error-dark)]',
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <span
                    className={cn(
                      'mx-2 hidden h-px w-6 sm:block md:w-10',
                      done && !failed ? 'bg-[var(--color-primary)]' : 'bg-[var(--kwork-border)]',
                    )}
                    aria-hidden
                  />
                )}
              </li>
            )
          })}
        </ol>
      )}

      {phase === 'succeeded' && (
        <Alert variant="success">{t('payment_checkout_success_detail')}</Alert>
      )}

      {phase === 'failed' && (
        <Alert variant="error">
          {t('payment_checkout_failed_detail')}
        </Alert>
      )}

      {phase === 'processing' && (
        <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('payment_checkout_processing_hint')}</p>
      )}

      {showButtons && (
        <div className="flex flex-wrap gap-2">
          {providers.includes('sandbox') && (
            <Button
              variant="primary"
              loading={isBusy}
              onClick={() => onPay('sandbox')}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {t('payment_pay_now')}
            </Button>
          )}
          {providers.includes('click') && (
            <Button variant="primary" loading={isBusy} onClick={() => onPay('click')}>
              Click
            </Button>
          )}
          {providers.includes('payme') && (
            <Button variant={providers.includes('click') ? 'outline' : 'primary'} loading={isBusy} onClick={() => onPay('payme')}>
              Payme
            </Button>
          )}
          {phase === 'failed' && (
            <Button variant="outline" onClick={onRetry}>
              {t('payment_checkout_retry')}
            </Button>
          )}
        </div>
      )}

      {showButtons && (
        <p className="text-[11px] text-[var(--kwork-text-muted)]">
          {paymentsLive ? t('payment_live_mode_note') : t('payment_provider_sandbox')} · {amountLabel}
        </p>
      )}
    </div>
  )
}
