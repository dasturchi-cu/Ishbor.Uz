'use client'

import { useBadgeCounts } from '@/application/providers/badge-counts-provider'

/** @deprecated useBadgeCounts — bitta shared query */
export function useMessageUnreadCount(enabled = true) {
  const { messageUnread } = useBadgeCounts()
  return enabled ? messageUnread : 0
}
