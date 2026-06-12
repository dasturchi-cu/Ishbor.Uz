export type PaymentProvider = 'sandbox' | 'click' | 'payme'

export type PaymentCheckoutPhase =
  | 'idle'
  | 'preparing'
  | 'redirecting'
  | 'processing'
  | 'succeeded'
  | 'failed'

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export const PAYMENT_CHECKOUT_STORAGE_PREFIX = 'ishbor_payment_checkout_'

export const PAYMENT_POLL_INTERVAL_MS = 2000
export const PAYMENT_POLL_MAX_ATTEMPTS = 60

export interface PaymentCheckoutSession {
  orderId: string
  intentId: string
  provider: PaymentProvider
  startedAt: number
}

export function paymentCheckoutStorageKey(orderId: string): string {
  return `${PAYMENT_CHECKOUT_STORAGE_PREFIX}${orderId}`
}

export function readPaymentCheckoutSession(orderId: string): PaymentCheckoutSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(paymentCheckoutStorageKey(orderId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PaymentCheckoutSession
    if (!parsed?.orderId || !parsed?.intentId || !parsed?.provider) return null
    return parsed
  } catch {
    return null
  }
}

export function writePaymentCheckoutSession(session: PaymentCheckoutSession): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(paymentCheckoutStorageKey(session.orderId), JSON.stringify(session))
}

export function clearPaymentCheckoutSession(orderId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(paymentCheckoutStorageKey(orderId))
}

export function intentStatusToPhase(status: string | undefined | null): PaymentCheckoutPhase | null {
  switch (status) {
    case 'requires_payment_method':
    case 'requires_action':
      return 'redirecting'
    case 'processing':
      return 'processing'
    case 'succeeded':
      return 'succeeded'
    case 'failed':
    case 'cancelled':
      return 'failed'
    default:
      return null
  }
}

export function isTerminalIntentStatus(status: string | undefined | null): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled'
}

export function isPaymentsLiveEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
}

export function availablePaymentProviders(): PaymentProvider[] {
  return isPaymentsLiveEnabled() ? ['click', 'payme'] : ['sandbox']
}

export function defaultPaymentProvider(): PaymentProvider {
  return availablePaymentProviders()[0]
}

export interface PaymentsConfigSnapshot {
  sandbox_allowed: boolean
  click_enabled: boolean
  payme_enabled: boolean
  live_available: boolean
  checkout_available?: boolean
  providers: PaymentProvider[]
}

export function isCheckoutAvailable(config?: PaymentsConfigSnapshot | null): boolean {
  if (config?.checkout_available != null) return config.checkout_available
  return resolveAvailableProviders(config).length > 0
}

export function resolveAvailableProviders(config?: PaymentsConfigSnapshot | null): PaymentProvider[] {
  if (config?.providers?.length) {
    return config.providers
  }
  return availablePaymentProviders()
}

export function prefersLiveCheckout(config?: PaymentsConfigSnapshot | null): boolean {
  const providers = resolveAvailableProviders(config)
  return providers.length > 0 && !providers.includes('sandbox')
}
