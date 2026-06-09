import type { TranslationKey } from '@/infrastructure/i18n'

export const MILESTONE_STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'milestone_status_pending',
  funded: 'milestone_status_funded',
  submitted: 'milestone_status_submitted',
  approved: 'milestone_status_approved',
  released: 'milestone_status_released',
  cancelled: 'milestone_status_cancelled',
}

export const CONTRACT_STATUS_KEYS: Record<string, TranslationKey> = {
  pending_payment: 'contract_status_pending_payment',
  active: 'contract_status_active',
  submitted: 'contract_status_submitted',
  revision_requested: 'contract_status_revision_requested',
  completed: 'contract_status_completed',
  cancelled: 'contract_status_cancelled',
  disputed: 'contract_status_disputed',
}

export const PAYMENT_STATUS_KEYS: Record<string, TranslationKey> = {
  unpaid: 'payment_status_unpaid',
  held: 'payment_status_held',
  released: 'payment_status_released',
  refunded: 'payment_status_refunded',
}

export const ESCROW_ACTION_KEYS: Record<string, TranslationKey> = {
  fund: 'admin_tab_fund',
  hold: 'admin_tab_hold',
  release: 'admin_tab_release',
  refund: 'admin_tab_refund',
}

export const ESCROW_SOURCE_KEYS: Record<string, TranslationKey> = {
  order: 'admin_tab_orders',
  contract: 'admin_tab_contracts',
  milestone: 'admin_tab_milestones',
}

export const PROJECT_STATUS_KEYS: Record<string, TranslationKey> = {
  draft: 'project_status_draft',
  open: 'project_status_open',
  closed: 'project_status_closed',
  in_review: 'project_status_in_review',
  accepted: 'project_status_accepted',
  active: 'project_status_active',
  disputed: 'project_status_disputed',
  cancelled: 'project_status_cancelled',
}

export function marketplaceStatusLabel(
  map: Record<string, TranslationKey>,
  value: string | null | undefined,
  t: (key: TranslationKey) => string
): string {
  if (!value) return '—'
  const key = map[value]
  return key ? t(key) : value
}

export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'outline' | 'dark'

export function serviceModerationBadge(
  moderationStatus: string | undefined,
  isHidden?: boolean
): { variant: StatusBadgeVariant; labelKey: TranslationKey } {
  const status = moderationStatus ?? 'approved'
  if (status === 'pending') {
    return { variant: 'warning', labelKey: 'service_moderation_pending' }
  }
  if (status === 'rejected') {
    return { variant: 'error', labelKey: 'service_moderation_rejected' }
  }
  if (isHidden) {
    return { variant: 'outline', labelKey: 'service_status_archived' }
  }
  return { variant: 'success', labelKey: 'service_status_active' }
}

export function projectStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'open':
    case 'accepted':
    case 'active':
    case 'completed':
      return 'success'
    case 'draft':
    case 'in_review':
      return 'warning'
    case 'disputed':
      return 'error'
    case 'cancelled':
    case 'closed':
      return 'outline'
    default:
      return 'outline'
  }
}
