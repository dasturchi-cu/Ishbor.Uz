'use client'

import { useEffect, useRef } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'

export function BrowserNotificationWatcher() {
  const { isLoggedIn } = useApp()
  const seenRef = useRef<Set<string>>(new Set())
  const askedRef = useRef(false)

  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined' || !('Notification' in window)) return

    if (!askedRef.current && Notification.permission === 'default') {
      askedRef.current = true
      Notification.requestPermission().catch(() => {})
    }

    const poll = async () => {
      if (Notification.permission !== 'granted') return
      const healthy = await api.health().catch(() => null)
      if (!healthy) return
      const items = await api.listNotifications().catch(() => [])
      for (const item of items) {
        if (!item.unread || seenRef.current.has(item.id)) continue
        seenRef.current.add(item.id)
        try {
          new Notification(item.title, {
            body: item.body,
            tag: item.id,
            icon: '/icon.svg',
          })
        } catch {
          // ignore
        }
      }
    }

    const timer = setInterval(poll, 60_000)
    const initial = setTimeout(poll, 5_000)
    return () => {
      clearInterval(timer)
      clearTimeout(initial)
    }
  }, [isLoggedIn])

  return null
}
