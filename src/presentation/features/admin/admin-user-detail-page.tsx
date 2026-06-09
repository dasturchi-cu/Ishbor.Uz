'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ban, ShieldCheck } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminUserDetail } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { formatDate } from '@/shared/lib/format-date'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'

export function AdminUserDetailPage({ userId }: { userId: string }) {
  const { t, language } = useApp()
  const { authed, ready } = useAuthReady()
  const router = useRouter()
  const [data, setData] = useState<ApiAdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminUserDetail(userId))
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    if (!ready || !authed) return
    void load()
  }, [load, ready, authed])

  const profile = data?.profile

  const quickAction = async (patch: { is_banned?: boolean; is_verified?: boolean }) => {
    setActionLoading(true)
    try {
      await api.adminUpdateUser(userId, patch)
      await load()
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminLayout onRefresh={() => void load()} refreshing={loading}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(PATHS.adminUsers)}>
          <ArrowLeft className="mr-1.5 size-4" />
          {t('admin_back_users')}
        </Button>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading && !profile ? (
        <div className="h-48 animate-pulse rounded-xl bg-[var(--admin-border)]" />
      ) : profile ? (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <Avatar name={profile.full_name ?? '?'} src={profile.avatar_url} size={64} />
                <div>
                  <h2 className="text-xl font-bold text-[var(--admin-text)]">{profile.full_name}</h2>
                  <p className="text-[13px] text-[var(--admin-muted)]">@{profile.username ?? profile.id.slice(0, 8)}</p>
                  <p className="mt-1 text-[13px]">{profile.email}</p>
                  <p className="text-[13px] text-[var(--admin-muted)]">{profile.phone ?? '—'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" loading={actionLoading} onClick={() => void quickAction({ is_verified: !profile.is_verified })}>
                  <ShieldCheck className="mr-1 size-3.5" />
                  {profile.is_verified ? t('admin_unverify') : t('admin_verify_approve')}
                </Button>
                <Button variant="outline" size="sm" loading={actionLoading} onClick={() => void quickAction({ is_banned: !profile.is_banned })} className="text-[var(--admin-danger)]">
                  <Ban className="mr-1 size-3.5" />
                  {profile.is_banned ? t('admin_unban') : t('admin_ban')}
                </Button>
                <Link href={PATHS.freelancerProfile + '/' + userId}>
                  <Button variant="ghost" size="sm">{t('admin_view_public')}</Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: t('admin_col_trust'), value: profile.trust_score ?? '—' },
                { label: t('admin_wallet_balance'), value: formatPrice(data.wallet_balance) },
                { label: t('admin_escrow_held'), value: formatPrice(data.escrow_held) },
                { label: t('admin_col_orders'), value: String(profile.orders_count ?? data.orders.length) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--admin-border)] p-3">
                  <p className="text-[11px] uppercase text-[var(--admin-muted)]">{item.label}</p>
                  <p className="mt-1 text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_tab_activity')}</h3>
              <ul className="max-h-80 space-y-2 overflow-y-auto text-[13px]">
                {(data.activities as { id: string; title?: string; created_at?: string }[]).map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 border-b border-[var(--admin-border)] py-2">
                    <span>{a.title ?? a.id}</span>
                    <span className="shrink-0 text-[var(--admin-muted)]">
                      {a.created_at ? formatRelativeTime(a.created_at, language) : '—'}
                    </span>
                  </li>
                ))}
                {data.activities.length === 0 && <li className="text-[var(--admin-muted)]">{t('admin_activity_empty')}</li>}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_tab_orders')}</h3>
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {data.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] py-2 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.services?.title ?? o.id.slice(0, 8)}</p>
                      <p className="text-[var(--admin-muted)]">{formatPrice(o.amount)}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
                {data.orders.length === 0 && <p className="text-[13px] text-[var(--admin-muted)]">{t('admin_orders_empty')}</p>}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_tab_audit')}</h3>
              <ul className="max-h-80 space-y-2 overflow-y-auto text-[13px]">
                {data.audit_logs.map((log) => (
                  <li key={log.id} className="border-b border-[var(--admin-border)] py-2">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-[12px] text-[var(--admin-muted)]">
                      {log.created_at ? formatDate(new Date(log.created_at), language) : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_fraud_logs')}</h3>
              <ul className="max-h-80 space-y-2 overflow-y-auto text-[13px]">
                {(data.fraud_logs as { id: string; fraud_type?: string; severity?: string; created_at?: string }[]).map((f) => (
                  <li key={f.id} className="border-b border-[var(--admin-border)] py-2">
                    <p className="font-medium">{f.fraud_type}</p>
                    <p className="text-[12px] text-[var(--admin-muted)]">{f.severity} · {f.created_at ? formatRelativeTime(f.created_at, language) : '—'}</p>
                  </li>
                ))}
                {data.fraud_logs.length === 0 && <li className="text-[var(--admin-muted)]">{t('admin_fraud_empty')}</li>}
              </ul>
            </Card>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
