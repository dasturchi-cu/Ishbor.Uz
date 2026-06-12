'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Shield, X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { loginPath, registerPath } from '@/shared/lib/auth-redirect'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Badge } from '@/presentation/components/ui/badge'
import type { TranslationKey } from '@/infrastructure/i18n'
import {
  calcFreelancerPayout,
  calcPlatformFee,
  PLATFORM_COMMISSION_PERCENT,
} from '@/domain/constants/commission'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PATHS } from '@/domain/constants/routes'

const STEPS = [
  { id: 1, labelKey: 'checkout_step_summary' as TranslationKey },
  { id: 2, labelKey: 'checkout_step_details' as TranslationKey },
  { id: 3, labelKey: 'checkout_step_confirm' as TranslationKey },
] as const

export interface CheckoutPackage {
  id: string
  labelKey: TranslationKey
  price: number
  days: number | null
}

export function ServiceOrderCheckout({
  open,
  title,
  selectedPackage,
  deliveryDays,
  orderNotes,
  onNotesChange,
  onSubmit,
  onClose,
  ordering,
  error,
  modalRef,
  guestAuthReturnTo,
}: {
  open: boolean
  title: string
  selectedPackage: CheckoutPackage | undefined
  deliveryDays: number | null
  orderNotes: string
  onNotesChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  ordering: boolean
  error: string
  modalRef: React.RefObject<HTMLDivElement | null>
  /** When set, step 3 shows login/register instead of pay (guest preview checkout). */
  guestAuthReturnTo?: string
}) {
  const { t } = useApp()
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (open) setStep(1)
  }, [open])

  if (!open || !selectedPackage) return null

  const price = selectedPackage.price
  const days = selectedPackage.days ?? deliveryDays

  const resetAndClose = () => {
    setStep(1)
    onClose()
  }

  const goNext = () => setStep((s) => Math.min(3, s + 1))
  const goBack = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="ishbor-order-modal-backdrop" role="presentation" onClick={resetAndClose}>
      <div
        ref={modalRef}
        className="ishbor-order-modal ishbor-order-modal--checkout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ishbor-order-modal__header">
          <div className="min-w-0 flex-1">
            <p className="ishbor-order-modal__eyebrow">{t('checkout_title')}</p>
            <h3 id="order-modal-title" className="ishbor-order-modal__title">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="ishbor-order-modal__close"
            onClick={resetAndClose}
            aria-label={t('close')}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <ol className="checkout-stepper" aria-label={t('checkout_title')}>
          {STEPS.map(({ id, labelKey }) => {
            const done = step > id
            const active = step === id
            return (
              <li key={id} className={cn('checkout-stepper__item', done && 'checkout-stepper__item--done', active && 'checkout-stepper__item--active')}>
                <span className="checkout-stepper__num">{done ? '✓' : id}</span>
                <span className="checkout-stepper__label">{t(labelKey)}</span>
              </li>
            )
          })}
        </ol>

        <div className="ishbor-order-modal__checkout-body">
          {step === 1 && (
            <>
              <div className="ishbor-order-modal__summary">
                <div className="ishbor-order-modal__summary-top">
                  <Badge variant="default" size="xs">
                    {t(selectedPackage.labelKey)}
                  </Badge>
                  {days != null && days > 0 && (
                    <span className="ishbor-order-modal__delivery">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {t('service_delivery_days').replace('{n}', String(days))}
                    </span>
                  )}
                </div>
                <p className="ishbor-order-modal__amount">{formatPrice(price)}</p>
              </div>
              <div className="ishbor-order-modal__trust">
                <Shield className="ishbor-order-modal__trust-icon" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="ishbor-order-modal__trust-title">{t('checkout_escrow_title')}</p>
                  <p className="ishbor-order-modal__trust-desc">{t('commission_escrow_note')}</p>
                  <Link
                    href={PATHS.buyerProtection}
                    className="mt-1 inline-flex text-[12px] font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    {t('marketplace_trust_learn_more')} →
                  </Link>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--ishbor-text-muted)]">{t('checkout_step_summary_hint')}</p>
            </>
          )}

          {step === 2 && (
            <>
              <CheckoutSummarySidebar price={price} packageLabel={t(selectedPackage.labelKey)} days={days} t={t} />
              {error && (
                <Alert variant="error" className="mb-3 py-2 text-[13px]">
                  {error}
                </Alert>
              )}
              <Textarea
                label={t('order_notes_label')}
                rows={4}
                value={orderNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder={t('order_notes_ph')}
                className="min-h-[108px] resize-none"
              />
              <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('checkout_notes_hint')}</p>
            </>
          )}

          {step === 3 && (
            <>
              <CheckoutSummarySidebar price={price} packageLabel={t(selectedPackage.labelKey)} days={days} t={t} />
              <div className="ishbor-order-modal__breakdown">
                <div className="ishbor-order-modal__breakdown-row">
                  <span>{t('commission_rate').replace('{rate}', String(PLATFORM_COMMISSION_PERCENT))}</span>
                  <span className="tabular-nums">{formatPrice(calcPlatformFee(price))}</span>
                </div>
                <div className="ishbor-order-modal__breakdown-row ishbor-order-modal__breakdown-row--net">
                  <span>{t('commission_payout_label')}</span>
                  <span className="tabular-nums font-semibold text-[var(--success-dark)]">
                    {formatPrice(calcFreelancerPayout(price))}
                  </span>
                </div>
              </div>
              {orderNotes.trim() && (
                <div className="rounded-[var(--r-md)] border border-[var(--ishbor-border)] bg-[var(--neutral-50)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ishbor-text-muted)]">
                    {t('order_notes_label')}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--ishbor-text)]">{orderNotes.trim()}</p>
                </div>
              )}
              {error && (
                <Alert variant="error" className="py-2 text-[13px]">
                  {error}
                </Alert>
              )}
              <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('payment_protected_note')}</p>
            </>
          )}
        </div>

        <div className="ishbor-order-modal__foot">
          {step > 1 ? (
            <Button variant="outline" fullWidth onClick={goBack} disabled={ordering}>
              {t('checkout_back')}
            </Button>
          ) : (
            <Button variant="outline" fullWidth onClick={resetAndClose}>
              {t('cancel')}
            </Button>
          )}
          {step < 3 ? (
            <Button variant="primary" fullWidth onClick={goNext}>
              {t('checkout_next_step')}
            </Button>
          ) : guestAuthReturnTo ? (
            <div className="flex w-full flex-col gap-2">
              <Link href={loginPath(guestAuthReturnTo)} className="block w-full">
                <Button variant="primary" fullWidth className="ishbor-order-cta" leftIcon={<Shield className="h-4 w-4" />}>
                  {t('checkout_guest_login')}
                </Button>
              </Link>
              <Link href={registerPath(guestAuthReturnTo)} className="block w-full">
                <Button variant="outline" fullWidth>
                  {t('checkout_guest_register')}
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              variant="primary"
              fullWidth
              loading={ordering}
              onClick={onSubmit}
              className="ishbor-order-cta"
              leftIcon={<Shield className="h-4 w-4" />}
            >
              {t('order_secure_cta')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckoutSummarySidebar({
  price,
  packageLabel,
  days,
  t,
}: {
  price: number
  packageLabel: string
  days: number | null
  t: (key: TranslationKey) => string
}) {
  return (
    <div className="checkout-summary-strip">
      <div>
        <p className="checkout-summary-strip__label">{packageLabel}</p>
        {days != null && days > 0 && (
          <p className="checkout-summary-strip__meta">
            {t('service_delivery_days').replace('{n}', String(days))}
          </p>
        )}
      </div>
      <p className="checkout-summary-strip__price">{formatPrice(price)}</p>
    </div>
  )
}
