import { describe, expect, it } from 'vitest'
import {
  availablePaymentProviders,
  defaultPaymentProvider,
  intentStatusToPhase,
  isPaymentsLiveEnabled,
  isTerminalIntentStatus,
  paymentCheckoutStorageKey,
  prefersLiveCheckout,
  resolveAvailableProviders,
} from './payment-checkout'

describe('payment-checkout', () => {
  it('maps intent statuses to checkout phases', () => {
    expect(intentStatusToPhase('requires_action')).toBe('redirecting')
    expect(intentStatusToPhase('processing')).toBe('processing')
    expect(intentStatusToPhase('succeeded')).toBe('succeeded')
    expect(intentStatusToPhase('cancelled')).toBe('failed')
    expect(intentStatusToPhase('unknown')).toBeNull()
  })

  it('detects terminal intent statuses', () => {
    expect(isTerminalIntentStatus('succeeded')).toBe(true)
    expect(isTerminalIntentStatus('failed')).toBe(true)
    expect(isTerminalIntentStatus('processing')).toBe(false)
  })

  it('builds stable session storage keys', () => {
    expect(paymentCheckoutStorageKey('abc')).toBe('ishbor_payment_checkout_abc')
  })

  it('selects providers based on NEXT_PUBLIC_PAYMENTS_ENABLED', () => {
    const prev = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = 'false'
    expect(isPaymentsLiveEnabled()).toBe(false)
    expect(availablePaymentProviders()).toEqual(['sandbox'])
    expect(defaultPaymentProvider()).toBe('sandbox')

    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = 'true'
    expect(isPaymentsLiveEnabled()).toBe(true)
    expect(availablePaymentProviders()).toEqual(['click', 'payme'])
    expect(defaultPaymentProvider()).toBe('click')

    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = prev
  })

  it('prefers backend payments config when provided', () => {
    expect(
      resolveAvailableProviders({
        sandbox_allowed: false,
        click_enabled: true,
        payme_enabled: true,
        live_available: true,
        providers: ['click', 'payme'],
      }),
    ).toEqual(['click', 'payme'])
    expect(
      prefersLiveCheckout({
        sandbox_allowed: false,
        click_enabled: true,
        payme_enabled: false,
        live_available: true,
        providers: ['click'],
      }),
    ).toBe(true)
  })
})
