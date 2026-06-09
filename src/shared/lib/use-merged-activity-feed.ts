'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiTransaction, ApiUserActivity } from '@/infrastructure/api/types'
import { PATHS, dashboardOrderPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'

export type FeedKind = 'activity' | 'order' | 'message' | 'payment'

export interface MergedFeedItem {
  id: string
  kind: FeedKind
  title: string
  body?: string
  href?: string
  created_at: string
}

const CACHE_TTL_MS = 30_000
let cache: { at: number; items: MergedFeedItem[] } | null = null

function orderStatusKey(status: string): TranslationKey {
  const map: Record<string, TranslationKey> = {
    pending: 'order_status_pending',
    active: 'order_status_active',
    delivered: 'order_status_delivered',
    completed: 'order_status_completed',
    cancelled: 'order_status_cancelled',
    revision: 'order_status_revision',
  }
  return map[status] ?? 'order_status_pending'
}

function paymentLabelKey(type: string): TranslationKey {
  if (type.includes('withdraw')) return 'withdraw_money'
  if (type.includes('release') || type.includes('payout')) return 'payment_status_released'
  if (type.includes('refund')) return 'payment_status_refunded'
  if (type.includes('hold') || type.includes('escrow')) return 'payment_status_held'
  return 'nav_payments'
}

function dedupeItems(items: MergedFeedItem[]): MergedFeedItem[] {
  const seen = new Set<string>()
  const out: MergedFeedItem[] = []
  for (const item of items) {
    const key = item.href ? `${item.kind}:${item.href}` : item.id
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function buildFeed(
  activities: ApiUserActivity[],
  orders: ApiOrder[],
  conversations: Awaited<ReturnType<typeof api.listConversations>>,
  transactions: ApiTransaction[],
  t: (key: TranslationKey) => string
): MergedFeedItem[] {
  const items: MergedFeedItem[] = []

  for (const a of activities) {
    items.push({
      id: `activity-${a.id}`,
      kind: 'activity',
      title: a.title,
      body: a.body ?? undefined,
      href: a.href ?? undefined,
      created_at: a.created_at,
    })
  }

  for (const o of orders) {
    const at = o.updated_at ?? o.created_at
    if (!at) continue
    items.push({
      id: `order-${o.id}`,
      kind: 'order',
      title: o.services?.title ?? t('nav_orders'),
      body: `${formatPrice(o.amount)} · ${t(orderStatusKey(o.status))}`,
      href: dashboardOrderPath(o.id),
      created_at: at,
    })
  }

  for (const c of conversations) {
    if (!c.last_message_at || !c.last_message) continue
    items.push({
      id: `message-${c.order_id}`,
      kind: 'message',
      title: c.other_user_name,
      body: c.last_message,
      href: `${PATHS.dashboardMessages}?order=${c.order_id}`,
      created_at: c.last_message_at,
    })
  }

  for (const tx of transactions) {
    if (!tx.created_at) continue
    items.push({
      id: `payment-${tx.id}`,
      kind: 'payment',
      title: t(paymentLabelKey(tx.type ?? '')),
      body: formatPrice(Math.abs(tx.amount)),
      href: tx.order_id ? dashboardOrderPath(tx.order_id) : PATHS.dashboardWallet,
      created_at: tx.created_at,
    })
  }

  return dedupeItems(items)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
}

export function useMergedActivityFeed(t: (key: TranslationKey) => string, limit = 12) {
  const [items, setItems] = useState<MergedFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      if (!opts?.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
        setItems(cache.items.slice(0, limit))
        setLoading(false)
        return
      }

      if (!opts?.silent) setLoading(true)

      const [activities, orders, conversations, transactions] = await Promise.all([
        api.listActivities(10).catch(() => [] as ApiUserActivity[]),
        api.listOrders({ limit: 12 }).catch(() => [] as ApiOrder[]),
        api.listConversations().catch(() => []),
        api.listTransactions().catch(() => [] as ApiTransaction[]),
      ])

      if (!mounted.current) return

      const merged = buildFeed(activities, orders, conversations, transactions, t)
      cache = { at: Date.now(), items: merged }
      setItems(merged.slice(0, limit))
      setLoading(false)
    },
    [t, limit]
  )

  useEffect(() => {
    mounted.current = true
    void load()
    const onFocus = () => void load({ silent: true })
    window.addEventListener('focus', onFocus)
    return () => {
      mounted.current = false
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  return { items, loading, reload: () => load({ force: true }) }
}

export function clearMergedActivityFeedCache() {
  cache = null
}
