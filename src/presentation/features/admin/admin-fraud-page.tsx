'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminFraudCenter } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import type { TranslationKey } from '@/infrastructure/i18n'

const FRAUD_TYPE_KEYS: Record<string, TranslationKey> = {
  fake_review: 'admin_fraud_type_fake_review',
  dispute_sla_breach: 'admin_fraud_type_dispute_sla_breach',
  spam: 'admin_fraud_type_spam',
  multiple_accounts: 'admin_fraud_type_multiple_accounts',
  off_platform_payment: 'admin_fraud_type_off_platform_payment',
}

export function AdminFraudPage() {
  const { t, language } = useApp()
  const { authed, ready } = useAuthReady()
  const [data, setData] = useState<ApiAdminFraudCenter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminFraudCenter())
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!ready || !authed) return
    void load()
  }, [load, ready, authed])

  const resolveLog = async (id: string) => {
    await api.adminResolveFraud(id)
    await load()
  }

  return (
    <AdminLayout onRefresh={() => void load()} refreshing={loading}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: t('admin_fraud_unresolved'), value: data?.summary.unresolved ?? 0, icon: ShieldAlert, accent: 'danger' },
          { label: t('admin_fraud_high'), value: data?.summary.high_severity ?? 0, icon: AlertTriangle, accent: 'warning' },
          { label: t('admin_fraud_compliance'), value: data?.summary.compliance_flags ?? 0, icon: CheckCircle2, accent: 'default' },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="admin-kpi-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase text-[var(--admin-muted)]">{kpi.label}</span>
                <Icon className="size-4 text-[var(--admin-muted)]" />
              </div>
              <p className="text-[28px] font-bold">{kpi.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_fraud_by_type')}</h2>
          <div className="space-y-3">
            {Object.entries(data?.by_type ?? {}).map(([type, items]) => (
              <div key={type} className="rounded-lg border border-[var(--admin-border)] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {FRAUD_TYPE_KEYS[type] ? t(FRAUD_TYPE_KEYS[type]) : type}
                  </span>
                  <span className="admin-badge admin-badge--warning">{items.length}</span>
                </div>
              </div>
            ))}
            {!data?.by_type || Object.keys(data.by_type).length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">{t('admin_fraud_empty')}</p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_fraud_recent')}</h2>
          <ul className="divide-y divide-[var(--admin-border)]">
            {(data?.recent ?? []).map((log) => {
              const row = log as { id: string; fraud_type?: string; severity?: string; user_id?: string; created_at?: string }
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]">
                  <div>
                    <p className="font-medium">
                      {row.fraud_type && FRAUD_TYPE_KEYS[row.fraud_type]
                        ? t(FRAUD_TYPE_KEYS[row.fraud_type])
                        : row.fraud_type}
                    </p>
                    <p className="text-[12px] text-[var(--admin-muted)]">
                      {row.severity} · {row.created_at ? formatRelativeTime(row.created_at, language) : '—'}
                    </p>
                    {row.user_id && (
                      <Link href={PATHS.adminUserDetail(row.user_id)} className="text-[12px] text-[var(--color-primary)] hover:underline">
                        {t('admin_view_user')}
                      </Link>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void resolveLog(row.id)}>
                    {t('admin_resolve')}
                  </Button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </AdminLayout>
  )
}
