'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { SkeletonListRow } from '@/presentation/components/ui/skeleton'
import { Bell, ShoppingBag, MessageCircle, Star, CheckCheck } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiNotification } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { applyReadState, markAllNotifsRead, markNotifRead } from '@/shared/lib/notification-reads'
import { resolveNotifText } from '@/shared/lib/resolve-notif-body'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { PATHS } from '@/domain/constants/routes'

const TYPE_ICON = {
  order: ShoppingBag,
  message: MessageCircle,
  review: Star,
} as const

export function NotificationsPage() {
  const { t, language } = useApp()
  const router = useRouter()
  const [items, setItems] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifications = () => {
    setLoading(true)
    setLoadError(false)
    api
      .listNotifications()
      .then((data) => setItems(applyReadState(data)))
      .catch(() => {
        setItems([])
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => n.unread) : items),
    [items, filter]
  )

  const unreadCount = items.filter((n) => n.unread).length

  const markAllRead = () => {
    void markAllNotifsRead()
      .then(() => setItems((prev) => prev.map((n) => ({ ...n, unread: false }))))
      .catch(() => undefined)
  }

  const handleClick = (item: ApiNotification) => {
    void markNotifRead(item.id)
      .then(() => setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))))
      .catch(() => undefined)
    if (item.href) router.push(item.href)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--kwork-text)] md:text-[28px]">
            {t('notifications_title')}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">{t('notifications_desc')}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 self-start">
            <CheckCheck className="h-4 w-4" />
            {t('mark_all_read')}
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-medium transition',
              filter === f
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-muted)] text-[var(--kwork-text-muted)] hover:text-[var(--kwork-text)]'
            )}
          >
            {f === 'all' ? t('messages_filter_all') : t('messages_filter_unread')}
            {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonListRow key={i} lines={2} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Bell className="h-10 w-10 text-[var(--kwork-text-muted)]" />
            <p className="text-[14px] text-[var(--kwork-text-muted)]">{t('notifications_empty')}</p>
            <Button variant="primary" size="sm" onClick={() => router.push(PATHS.services)}>
              {t('notifications_browse_cta')}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--kwork-border)]">
            {filtered.map((item) => {
              const Icon = TYPE_ICON[item.type]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(item)}
                    className={cn(
                      'flex w-full gap-4 px-5 py-4 text-left transition hover:bg-[var(--color-bg-subtle)]',
                      item.unread && 'bg-[var(--color-primary-light)]/40'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        item.type === 'order' && 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                        item.type === 'message' && 'bg-[var(--success-bg)] text-[var(--success-text)]',
                        item.type === 'review' && 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-semibold text-[var(--kwork-text)]">
                          {resolveNotifText(item.title, t)}
                        </p>
                        <span className="shrink-0 text-[11px] text-[var(--kwork-text-muted)]">
                          {formatRelativeTime(item.created_at, language)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-[var(--kwork-text-muted)]">
                        {resolveNotifText(item.body, t)}
                      </p>
                    </div>
                    {item.unread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
