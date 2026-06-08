import type { ApiOrder } from '@/infrastructure/api/types'

export function ordersInPeriod(orders: ApiOrder[], days: number): ApiOrder[] {
  const since = Date.now() - days * 86_400_000
  return orders.filter((o) => {
    if (!o.created_at) return false
    return new Date(o.created_at).getTime() >= since
  })
}

export function revenueByMonth(orders: ApiOrder[], months = 6): { date: string; amount: number }[] {
  const completed = orders.filter((o) => o.status === 'completed')
  const buckets = new Map<string, number>()

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('uz-UZ', { month: 'short' })
    buckets.set(key, 0)
  }

  for (const o of completed) {
    if (!o.created_at) continue
    const d = new Date(o.created_at)
    const key = d.toLocaleDateString('uz-UZ', { month: 'short' })
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + o.amount)
    }
  }

  return [...buckets.entries()].map(([date, amount]) => ({ date, amount }))
}

export function ordersByStatus(orders: ApiOrder[]): { name: string; value: number; color: string }[] {
  const counts: Record<string, number> = {
    pending: 0,
    active: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const o of orders) {
    if (o.status in counts) counts[o.status] += 1
  }
  return [
    { name: 'active', value: counts.active + counts.pending, color: 'var(--color-primary)' },
    { name: 'completed', value: counts.completed, color: 'var(--success)' },
    { name: 'pending', value: counts.delivered, color: 'var(--warning)' },
    { name: 'cancelled', value: counts.cancelled, color: 'var(--error)' },
  ].filter((e) => e.value > 0)
}

export function buyerRegions(orders: ApiOrder[]): { region: string; pct: number }[] {
  const regions = new Map<string, number>()
  for (const o of orders) {
    const region = o.client_profile?.region?.trim()
    if (!region) continue
    regions.set(region, (regions.get(region) ?? 0) + 1)
  }
  const total = [...regions.values()].reduce((a, b) => a + b, 0)
  if (!total) return []
  return [...regions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([region, count]) => ({ region, pct: Math.round((count / total) * 100) }))
}

export function orderCountForService(orders: ApiOrder[], serviceId: string): number {
  return orders.filter((o) => o.service_id === serviceId).length
}
