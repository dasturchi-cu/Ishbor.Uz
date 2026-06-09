'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Database, Bell, CreditCard } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { api } from '@/infrastructure/api/client'
import type { ApiHealthReady } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'

const HEALTH_POLL_MS = 60_000

function StatusBadge({ ok, okLabel, errorLabel }: { ok: boolean; okLabel: string; errorLabel: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-500/15 text-red-700 dark:text-red-400'
      }`}
    >
      {ok ? okLabel : errorLabel}
    </span>
  )
}

function HealthRow({
  label,
  value,
  enabledLabel,
  disabledLabel,
}: {
  label: string
  value: boolean
  enabledLabel: string
  disabledLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-[var(--admin-muted)]">{label}</span>
      <StatusBadge ok={value} okLabel={enabledLabel} errorLabel={disabledLabel} />
    </div>
  )
}

export function AdminHealthPanel() {
  const { t } = useApp()
  const [health, setHealth] = useState<ApiHealthReady | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setHealth(await api.healthReady())
      setError(false)
    } catch {
      setHealth(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), HEALTH_POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const okLabel = t('admin_health_status_ok')
  const errorLabel = t('admin_health_status_error')
  const enabledLabel = t('admin_health_enabled')
  const disabledLabel = t('admin_health_disabled')

  const groups: {
    titleKey: TranslationKey
    icon: typeof Database
    rows: { labelKey: TranslationKey; value: boolean }[]
  }[] = health
    ? [
        {
          titleKey: 'admin_health_payments',
          icon: CreditCard,
          rows: [
            { labelKey: 'admin_health_click', value: health.payments.click },
            { labelKey: 'admin_health_payme', value: health.payments.payme },
          ],
        },
        {
          titleKey: 'admin_health_notifications',
          icon: Bell,
          rows: [
            { labelKey: 'admin_health_email', value: health.notifications.email },
            { labelKey: 'admin_health_sms', value: health.notifications.sms },
            { labelKey: 'admin_health_telegram', value: health.notifications.telegram },
            { labelKey: 'admin_health_redis', value: health.notifications.redis },
          ],
        },
      ]
    : []

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          <Activity className="size-4" aria-hidden />
          {t('admin_health_section')}
        </h2>
        {!loading && (
          <StatusBadge
            ok={!error && health?.status === 'ready'}
            okLabel={okLabel}
            errorLabel={errorLabel}
          />
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">{t('admin_health_loading')}</p>
      ) : error ? (
        <p className="text-sm text-[var(--admin-danger)]">{t('admin_health_status_error')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--admin-border)] p-3">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase text-[var(--admin-muted)]">
              <Database className="size-3.5" aria-hidden />
              {t('admin_health_database')}
            </div>
            <StatusBadge ok={health?.database === 'ok'} okLabel={okLabel} errorLabel={errorLabel} />
          </div>

          {groups.map((group) => {
            const Icon = group.icon
            return (
              <div key={group.titleKey} className="rounded-lg border border-[var(--admin-border)] p-3">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase text-[var(--admin-muted)]">
                  <Icon className="size-3.5" aria-hidden />
                  {t(group.titleKey)}
                </div>
                <div className="space-y-2">
                  {group.rows.map((row) => (
                    <HealthRow
                      key={row.labelKey}
                      label={t(row.labelKey)}
                      value={row.value}
                      enabledLabel={enabledLabel}
                      disabledLabel={disabledLabel}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
