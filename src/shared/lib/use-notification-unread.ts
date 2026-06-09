'use client'

import { useBadgeCounts } from '@/application/providers/badge-counts-provider'

/** @deprecated useBadgeCounts — bitta shared query */
export function useNotificationUnreadCount(enabled = true) {
  const { notificationUnread } = useBadgeCounts()
  return enabled ? notificationUnread : 0
}
