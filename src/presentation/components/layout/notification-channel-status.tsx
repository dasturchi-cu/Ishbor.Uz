'use client'

import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export function NotificationChannelStatus({
  email,
  sms,
  telegram,
}: {
  email: boolean
  sms: boolean
  telegram: boolean
}) {
  const { t } = useApp()
  const items = [
    { key: 'email', label: t('email_notifications'), active: email },
    { key: 'sms', label: t('sms_notifications'), active: sms },
    { key: 'telegram', label: t('telegram_notifications'), active: telegram },
  ]

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-medium',
            item.active
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              : 'bg-[var(--neutral-100)] text-[var(--ishbor-text-muted)]'
          )}
        >
          {item.label}: {item.active ? t('notif_channel_active') : t('notif_channel_inactive')}
        </span>
      ))}
    </div>
  )
}
