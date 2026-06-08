'use client'

import { Badge } from '@/presentation/components/ui/badge'
import { useApp } from '@/application/providers/app-provider'
import type { TranslationKey } from '@/infrastructure/i18n'

export type OrderStatus =
  | 'pending'
  | 'active'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'revision'

const STATUS_CONFIG: Record<
  OrderStatus,
  { variant: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'; labelKey: TranslationKey }
> = {
  pending: { variant: 'warning', labelKey: 'order_status_pending' },
  active: { variant: 'info', labelKey: 'order_status_active' },
  delivered: { variant: 'primary', labelKey: 'order_status_delivered' },
  completed: { variant: 'success', labelKey: 'order_status_completed' },
  cancelled: { variant: 'error', labelKey: 'order_status_cancelled' },
  revision: { variant: 'default', labelKey: 'order_status_revision' },
}

export interface OrderStatusBadgeProps {
  status: OrderStatus | string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useApp()
  const config = STATUS_CONFIG[status as OrderStatus] ?? STATUS_CONFIG.pending

  return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>
}
