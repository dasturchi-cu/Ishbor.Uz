import type { TranslationKey } from '@/infrastructure/i18n'

type Role = 'client' | 'freelancer'

export function orderNextStepHintKey(
  role: Role,
  status: string,
  paymentStatus?: string | null
): TranslationKey | null {
  if (status === 'cancelled' || status === 'disputed') return null

  if (role === 'client') {
    if (status === 'pending' && paymentStatus !== 'held') return 'order_hint_client_pay'
    if (status === 'pending') return 'order_hint_client_wait_start'
    if (status === 'active') return 'order_hint_client_in_progress'
    if (status === 'delivered') return 'order_hint_client_review_work'
    if (status === 'completed') return 'order_hint_client_leave_review'
  }

  if (role === 'freelancer') {
    if (status === 'pending' && paymentStatus !== 'held') return 'order_hint_freelancer_wait_pay'
    if (status === 'pending') return 'order_hint_freelancer_accept'
    if (status === 'active') return 'order_hint_freelancer_deliver'
    if (status === 'delivered') return 'order_hint_freelancer_wait_approval'
    if (status === 'completed') return 'order_hint_freelancer_done'
  }

  return null
}
