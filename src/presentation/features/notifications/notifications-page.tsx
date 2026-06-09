'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Button } from '@/presentation/components/ui/button'
import { SkeletonListRow } from '@/presentation/components/ui/skeleton'
import { Bell, ShoppingBag, MessageCircle, Star, Megaphone, CheckCheck, X } from 'lucide-react'
import { toast } from '@/presentation/components/ui/toast'
import { ApiError, api } from '@/infrastructure/api/client'
import type { ApiNotification } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { markAllNotifsRead, markNotifRead } from '@/shared/lib/notification-reads'
import { resolveNotifText } from '@/shared/lib/resolve-notif-body'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { PATHS } from '@/domain/constants/routes'
import { useNotificationsFeed } from '@/application/providers/notifications-provider'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'

const TYPE_ICON = {
  order: ShoppingBag,
  message: MessageCircle,
  review: Star,
  broadcast: Megaphone,
} as const

export function NotificationsPage() {
  const { t, language } = useApp()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { notifications: items, loading, error, loadError, refetch, ensureLoaded } = useNotificationsFeed()

  useEffect(() => {
    ensureLoaded()
  }, [ensureLoaded])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  const patchCache = (mapper: (rows: ApiNotification[]) => ApiNotification[]) => {
    queryClient.setQueryData<ApiNotification[]>(queryKeys.notifications, (prev) =>
      prev ? mapper(prev) : prev
    )
  }

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => n.unread) : items),
    [items, filter]
  )

  const unreadCount = items.filter((n) => n.unread).length

  const markAllRead = () => {
    void markAllNotifsRead()
      .then(() => patchCache((prev) => prev.map((n) => ({ ...n, unread: false }))))
      .catch(() => undefined)
  }

  const handleDismiss = (item: ApiNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissingId(item.id)
    void api
      .dismissNotifications([item.id])
      .then(() => {
        patchCache((prev) => prev.filter((n) => n.id !== item.id))
        toast.success(t('notification_dismissed'))
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : t('error_required'))
      })
      .finally(() => setDismissingId(null))
  }

  const handleClick = (item: ApiNotification) => {
    void markNotifRead(item.id)
      .then(() => patchCache((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))))
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

      {error && (
        <LoadErrorAlert
          error={loadError}
          scope="notifications"
          onRetry={() => void refetch()}
          className="mb-4"
        />
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
            <p className="text-[14px] text-[var(--kwork-text-muted)]">
              {filter === 'unread' && items.length > 0
                ? t('notifications_empty_unread')
                : t('notifications_empty')}
            </p>
            {!(filter === 'unread' && items.length > 0) && (
              <Button variant="primary" size="sm" onClick={() => router.push(PATHS.services)}>
                {t('notifications_browse_cta')}
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--kwork-border)]">
            {filtered.map((item) => {
              const Icon = TYPE_ICON[item.type]
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      'flex w-full items-stretch transition hover:bg-[var(--color-bg-subtle)]',
                      item.unread && 'bg-[var(--color-primary-light)]/40'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleClick(item)}
                      className="flex min-w-0 flex-1 gap-4 px-5 py-4 text-left"
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
                    <button
                      type="button"
                      aria-label={t('notification_dismiss')}
                      disabled={dismissingId === item.id}
                      onClick={(e) => handleDismiss(item, e)}
                      className="shrink-0 px-4 text-[var(--kwork-text-muted)] hover:text-[var(--error)] disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
