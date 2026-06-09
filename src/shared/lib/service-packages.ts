import type { ApiServicePackage } from '@/infrastructure/api/types'

export const PACKAGE_DEFS = [
  { id: 'basic', label_key: 'package_basic' },
  { id: 'standard', label_key: 'package_standard' },
  { id: 'premium', label_key: 'package_premium' },
] as const

export function buildDefaultPackages(price: number, deliveryDays: number): ApiServicePackage[] {
  const safePrice = Math.max(0, price)
  const safeDays = Math.min(365, Math.max(1, deliveryDays || 5))
  return [
    { id: 'basic', label_key: 'package_basic', price: safePrice, delivery_days: safeDays },
    {
      id: 'standard',
      label_key: 'package_standard',
      price: Math.round(safePrice * 1.5),
      delivery_days: Math.max(1, safeDays - 1),
    },
    {
      id: 'premium',
      label_key: 'package_premium',
      price: Math.round(safePrice * 2.2),
      delivery_days: Math.max(1, safeDays - 2),
    },
  ]
}

export function normalizePackages(
  existing: ApiServicePackage[] | undefined,
  price: number,
  deliveryDays: number
): ApiServicePackage[] {
  const defaults = buildDefaultPackages(price, deliveryDays)
  if (!existing?.length) return defaults
  const byId = new Map(existing.filter((p) => p?.id).map((p) => [p.id, p]))
  return PACKAGE_DEFS.map((def) => {
    const row = byId.get(def.id)
    if (row && row.price > 0) {
      return {
        id: def.id,
        label_key: row.label_key || def.label_key,
        price: row.price,
        delivery_days:
          row.delivery_days > 0
            ? row.delivery_days
            : (defaults.find((d) => d.id === def.id)?.delivery_days ?? 5),
      }
    }
    return defaults.find((d) => d.id === def.id)!
  })
}
