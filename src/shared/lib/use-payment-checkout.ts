'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import {
  clearPaymentCheckoutSession,
  intentStatusToPhase,
  isTerminalIntentStatus,
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_POLL_MAX_ATTEMPTS,
  readPaymentCheckoutSession,
  writePaymentCheckoutSession,
  type PaymentCheckoutPhase,
  type PaymentProvider,
} from '@/domain/constants/payment-checkout'
import { isAllowedPaymentRedirectUrl } from '@/shared/lib/safe-url'

interface UsePaymentCheckoutOptions {
  order: ApiOrder | null
  onOrderUpdate: (order: ApiOrder) => void
  onError: (message: string) => void
  onSucceeded?: () => void
}

export function usePaymentCheckout({
  order,
  onOrderUpdate,
  onError,
  onSucceeded,
}: UsePaymentCheckoutOptions) {
  const [phase, setPhase] = useState<PaymentCheckoutPhase>('idle')
  const [provider, setProvider] = useState<PaymentProvider | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    attemptsRef.current = 0
  }, [])

  const resolveFromOrder = useCallback(
    (updated: ApiOrder) => {
      onOrderUpdate(updated)
      if (updated.payment_status === 'held') {
        stopPolling()
        if (order?.id) clearPaymentCheckoutSession(order.id)
        setPhase('succeeded')
        onSucceeded?.()
        return true
      }
      return false
    },
    [onOrderUpdate, onSucceeded, order?.id, stopPolling],
  )

  const pollPaymentStatus = useCallback(
    async (orderId: string) => {
      attemptsRef.current += 1
      if (attemptsRef.current > PAYMENT_POLL_MAX_ATTEMPTS) {
        stopPolling()
        setPhase('failed')
        onError('payment_checkout_timeout')
        return
      }

      try {
        const [freshOrder, intent] = await Promise.all([
          api.getOrder(orderId),
          api.getOrderPaymentIntent(orderId).catch(() => null),
        ])

        if (resolveFromOrder(freshOrder)) return

        const intentPhase = intent ? intentStatusToPhase(intent.status) : null
        if (intentPhase === 'failed') {
          stopPolling()
          clearPaymentCheckoutSession(orderId)
          setPhase('failed')
          onError('payment_checkout_failed')
          return
        }

        if (intentPhase === 'processing' || intentPhase === 'redirecting') {
          setPhase('processing')
        }
      } catch {
        // Keep polling — webhook may still be in flight.
      }
    },
    [onError, resolveFromOrder, stopPolling],
  )

  const startPolling = useCallback(
    (orderId: string) => {
      stopPolling()
      setPhase('processing')
      void pollPaymentStatus(orderId)
      pollRef.current = setInterval(() => {
        void pollPaymentStatus(orderId)
      }, PAYMENT_POLL_INTERVAL_MS)
    },
    [pollPaymentStatus, stopPolling],
  )

  useEffect(() => {
    if (!order) return
    if (order.payment_status === 'held') {
      clearPaymentCheckoutSession(order.id)
      return
    }
    const session = readPaymentCheckoutSession(order.id)
    if (!session) return

    setProvider(session.provider)
    startPolling(order.id)
  }, [order, startPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  const handlePay = useCallback(
    async (selected: PaymentProvider) => {
      if (!order) return
      setProvider(selected)
      setPhase('preparing')
      onError('')

      try {
        const result = await api.checkoutOrder(order.id, selected)
        const redirectUrl = result.redirect_url ?? result.payment_intent?.redirect_url

        if (redirectUrl && isAllowedPaymentRedirectUrl(redirectUrl)) {
          const intentId = result.payment_intent?.id
          if (intentId) {
            writePaymentCheckoutSession({
              orderId: order.id,
              intentId,
              provider: selected,
              startedAt: Date.now(),
            })
          }
          setPhase('redirecting')
          window.location.assign(redirectUrl)
          return
        }

        setPhase('processing')
        if (resolveFromOrder(result.order)) return

        if (result.payment_intent && !isTerminalIntentStatus(result.payment_intent.status)) {
          startPolling(order.id)
          return
        }

        setPhase('failed')
        onError('payment_checkout_failed')
      } catch (e) {
        setPhase('failed')
        const msg = e instanceof Error ? e.message : 'error_required'
        onError(msg)
      }
    },
    [onError, order, resolveFromOrder, startPolling],
  )

  const retry = useCallback(() => {
    stopPolling()
    if (order?.id) clearPaymentCheckoutSession(order.id)
    setPhase('idle')
    setProvider(null)
  }, [order?.id, stopPolling])

  const isBusy = phase === 'preparing' || phase === 'redirecting' || phase === 'processing'

  return {
    phase,
    provider,
    isBusy,
    handlePay,
    retry,
  }
}
