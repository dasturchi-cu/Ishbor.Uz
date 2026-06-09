'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import type { ApiNotification } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { isSafeInternalHref } from '@/shared/lib/safe-url'
import { cn } from '@/shared/lib/utils'
import { markAllNotifsRead, markNotifRead } from '@/shared/lib/notification-reads'
import { resolveNotifText } from '@/shared/lib/resolve-notif-body'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { useNotificationsQuery } from '@/shared/lib/use-notifications-query'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'

interface NotifItem {
  id: string
  type: 'message' | 'order' | 'review' | 'broadcast'
  title: string
  body: string
  time: string
  unread: boolean
  href: string
}

function fromApiNotifications(items: ApiNotification[], language: 'uz' | 'ru' | 'en'): NotifItem[] {
  return items.slice(0, 10).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    time: formatRelativeTime(n.created_at, language),
    unread: n.unread,
    href: isSafeInternalHref(n.href) ? (n.href as string) : PATHS.notifications,
  }))
}

const TYPE_META: Record<NotifItem['type'], { icon: LucideIcon; iconClass: string }> = {
  order: { icon: ShoppingBag, iconClass: 'notification-dropdown-icon--order' },
  message: { icon: MessageCircle, iconClass: 'notification-dropdown-icon--message' },
  review: { icon: Star, iconClass: 'notification-dropdown-icon--review' },
  broadcast: { icon: Megaphone, iconClass: 'notification-dropdown-icon--broadcast' },
}

export function NotificationDropdown() {
  const { t, language, userId } = useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications } = useNotificationsQuery(userId, Boolean(userId))

  const items = fromApiNotifications(notifications, language)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = items.filter((n) => n.unread).length

  const patchCache = (mapper: (rows: ApiNotification[]) => ApiNotification[]) => {
    queryClient.setQueryData<ApiNotification[]>(queryKeys.notifications, (prev) =>
      prev ? mapper(prev) : prev
    )
  }

  const markAllRead = () => {
    void markAllNotifsRead()
      .then(() => patchCache((rows) => rows.map((n) => ({ ...n, unread: false }))))
      .catch(() => undefined)
  }
  const markOneRead = (id: string) => {
    void markNotifRead(id)
      .then(() => patchCache((rows) => rows.map((n) => (n.id === id ? { ...n, unread: false } : n))))
      .catch(() => undefined)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text-muted)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--kwork-border))] hover:text-[var(--color-primary)]"
        aria-label={t('notifications_title')}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--error)] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown absolute right-0 top-[calc(100%+6px)] z-50">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">{t('notifications_title')}</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="notification-dropdown-mark" aria-label={t('mark_all_read')}>
                <CheckCheck className="h-3.5 w-3.5" />
                {t('mark_all_read_short')}
              </button>
            )}
          </div>

          <ul className="notification-dropdown-list">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('notifications_empty')}</p>
                <Link
                  href={PATHS.services}
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-block text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
                >
                  {t('notifications_browse_cta')}
                </Link>
              </li>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type]
                const Icon = meta.icon
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        markOneRead(n.id)
                        setOpen(false)
                      }}
                      className={cn('notification-dropdown-item', n.unread && 'notification-dropdown-item--unread')}
                    >
                      <div className={cn('notification-dropdown-icon', meta.iconClass)}>
                        <Icon />
                      </div>
                      <div className="notification-dropdown-content">
                        <div className="notification-dropdown-row">
                          <p className="notification-dropdown-item-title">{resolveNotifText(n.title, t)}</p>
                          <span className="notification-dropdown-item-time">{n.time}</span>
                        </div>
                        <p className="notification-dropdown-item-body">{resolveNotifText(n.body, t)}</p>
                      </div>
                      {n.unread && <span className="notification-dropdown-dot" aria-hidden />}
                    </Link>
                  </li>
                )
              })
            )}
          </ul>

          <div className="notification-dropdown-footer">
            <Link href={PATHS.notifications} onClick={() => setOpen(false)} className="notification-dropdown-footer-link">
              {t('view_all_notifications')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
