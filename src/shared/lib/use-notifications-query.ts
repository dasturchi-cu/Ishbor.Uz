'use client'

/**
 * @deprecated NotificationsProvider + useNotificationsFeed ishlating.
 * Faqat notifications sahifasi va legacy uchun qoldirilgan.
 */
import { useNotificationsFeed } from '@/application/providers/notifications-provider'

export function useNotificationsQuery(_userId: string | null | undefined, enabled = true) {
  const feed = useNotificationsFeed()
  return {
    notifications: enabled ? feed.notifications : [],
    loading: enabled ? feed.loading : false,
    error: enabled ? feed.error : false,
    loadError: enabled ? feed.loadError : null,
    refresh: feed.refresh,
    refetch: feed.refetch,
  }
}
