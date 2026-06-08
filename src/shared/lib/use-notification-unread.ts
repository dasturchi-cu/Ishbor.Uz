'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import { useApp } from '@/application/providers/app-provider'
import { useNotificationsRealtime } from '@/shared/lib/use-notifications-realtime'

export function useNotificationUnreadCount(enabled = true) {
  const { userId } = useApp()
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    api
      .listNotifications()
      .then((items) => setCount(items.filter((n) => n.unread).length))
      .catch(() => setCount(0))
  }, [])

  useEffect(() => {
    if (!enabled) return
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [enabled, load])

  useNotificationsRealtime(enabled ? userId : null, load)

  return count
}
