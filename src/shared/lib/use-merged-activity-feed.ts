'use client'



import { useQuery } from '@tanstack/react-query'

import { useMemo } from 'react'

import { api } from '@/infrastructure/api/client'

import type { ApiActivityFeedItem } from '@/infrastructure/api/types'

import { formatPrice } from '@/shared/lib/format'

import type { TranslationKey } from '@/infrastructure/i18n'

import { queryKeys } from '@/shared/lib/query-keys'

import { useAuthReady } from '@/shared/lib/use-auth-ready'

import { wrapQueryFn } from '@/shared/lib/request-debug'



export type FeedKind = 'activity' | 'order' | 'message' | 'payment'



export interface MergedFeedItem {

  id: string

  kind: FeedKind

  title: string

  body?: string

  href?: string

  created_at: string

}



function orderStatusKey(status: string): TranslationKey {

  const map: Record<string, TranslationKey> = {

    pending: 'order_status_pending',

    active: 'order_status_active',

    delivered: 'order_status_delivered',

    completed: 'order_status_completed',

    cancelled: 'order_status_cancelled',

    revision: 'order_status_revision',

    disputed: 'disputed',

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



function mapFeedItem(item: ApiActivityFeedItem, t: (key: TranslationKey) => string): MergedFeedItem {

  if (item.kind === 'order') {

    const amount = item.amount ?? 0

    const status = item.order_status ?? 'pending'

    return {

      id: item.id,

      kind: item.kind,

      title: item.title === 'order' ? t('nav_orders') : item.title,

      body: `${formatPrice(amount)} · ${t(orderStatusKey(status))}`,

      href: item.href ?? undefined,

      created_at: item.created_at,

    }

  }

  if (item.kind === 'payment') {

    return {

      id: item.id,

      kind: item.kind,

      title: t(paymentLabelKey(item.payment_type ?? '')),

      body: formatPrice(item.amount ?? 0),

      href: item.href ?? undefined,

      created_at: item.created_at,

    }

  }

  return {

    id: item.id,

    kind: item.kind,

    title: item.title,

    body: item.body ?? undefined,

    href: item.href ?? undefined,

    created_at: item.created_at,

  }

}



export function useMergedActivityFeed(t: (key: TranslationKey) => string, limit = 12) {

  const { ready, authed, userId } = useAuthReady()



  const query = useQuery({

    queryKey: queryKeys.activityFeed(limit),

    queryFn: wrapQueryFn(
      'activity-feed',
      () => api.getActivityFeed(limit).catch(() => []),
      { queryKey: `activity-feed:${limit}` }
    ),
    enabled: ready && authed && Boolean(userId),
    staleTime: 60_000,
    refetchOnMount: false,
  })



  const items = useMemo(

    () => (query.data ?? []).map((item) => mapFeedItem(item, t)),

    [query.data, t]

  )



  return {

    items,

    loading: query.isLoading,

    reload: () => void query.refetch(),

  }

}



export function clearMergedActivityFeedCache() {

  /* React Query cache — invalidate via queryClient if needed */

}

