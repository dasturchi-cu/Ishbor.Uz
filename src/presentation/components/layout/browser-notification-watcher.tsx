'use client'

import { useEffect, useRef } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { useNotificationsQuery } from '@/shared/lib/use-notifications-query'

const SEEN_STORAGE_KEY = 'ishbor:browser-notif-seen'
const MAX_SEEN_IDS = 200

function loadSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function persistSeenIds(ids: Set<string>) {
  try {
    const list = [...ids].slice(-MAX_SEEN_IDS)
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
}

export function BrowserNotificationWatcher() {
  const { isLoggedIn, userId } = useApp()
  const seenRef = useRef<Set<string>>(loadSeenIds())
  const askedRef = useRef(false)
  const { notifications } = useNotificationsQuery(userId, isLoggedIn)

  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined' || !('Notification' in window)) return

    if (!askedRef.current && Notification.permission === 'default') {
      askedRef.current = true
      Notification.requestPermission().catch(() => {})
    }

    if (Notification.permission !== 'granted') return

    let changed = false
    for (const item of notifications) {
      if (!item.unread || seenRef.current.has(item.id)) continue
      seenRef.current.add(item.id)
      changed = true
      try {
        new Notification(item.title, {
          body: item.body,
          tag: item.id,
          icon: '/icon.svg',
        })
      } catch {
        /* ignore */
      }
    }
    if (changed) persistSeenIds(seenRef.current)
  }, [isLoggedIn, notifications])

  return null
}
