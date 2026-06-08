'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminStats, ApiOrder, ApiProfile, ApiService, ApiWithdrawalRequest } from '@/infrastructure/api/types'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'

export function AdminPage() {
  const { t, profile, isAuthLoading, isLoggedIn, currentUserRole, refreshProfile } = useApp()
  const [stats, setStats] = useState<ApiAdminStats | null>(null)
  const [users, setUsers] = useState<ApiProfile[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [error, setError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [withdrawals, setWithdrawals] = useState<ApiWithdrawalRequest[]>([])
  const [withdrawalActionId, setWithdrawalActionId] = useState<string | null>(null)
  const [disputeActionId, setDisputeActionId] = useState<string | null>(null)
  const [userActionId, setUserActionId] = useState<string | null>(null)
  const [services, setServices] = useState<ApiService[]>([])
  const [serviceActionId, setServiceActionId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn || profile || profileLoading) return
    setProfileLoading(true)
    refreshProfile().finally(() => setProfileLoading(false))
  }, [isAuthLoading, isLoggedIn, profile, profileLoading, refreshProfile])

  useEffect(() => {
    if (!profile?.is_admin) return

    let cancelled = false
    setError('')

    const load = async () => {
      const [statsRes, usersRes, ordersRes, withdrawalsRes, servicesRes] = await Promise.allSettled([
        api.adminStats(),
        api.adminUsers(),
        api.adminOrders(),
        api.adminWithdrawals(),
        api.adminListServices({ limit: 30 }),
      ])

      if (cancelled) return

      const failures: string[] = []

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value)
      } else {
        failures.push(
          statsRes.reason instanceof Error ? statsRes.reason.message : t('admin_load_stats_failed')
        )
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value)
      } else {
        failures.push(
          usersRes.reason instanceof Error ? usersRes.reason.message : t('admin_load_users_failed')
        )
      }

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value)
      } else {
        failures.push(
          ordersRes.reason instanceof Error ? ordersRes.reason.message : t('admin_load_orders_failed')
        )
      }

      if (withdrawalsRes.status === 'fulfilled') {
        setWithdrawals(withdrawalsRes.value)
      }

      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value)
      }

      if (failures.length > 0) {
        setError(failures.join(' · '))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [profile, t])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.full_name?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false)
    )
  }, [users, userSearch])

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        (o.services?.title?.toLowerCase().includes(q) ?? false) ||
        o.status.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    )
  }, [orders, orderSearch])

  const disputedOrders = useMemo(
    () => orders.filter((o) => o.status === 'disputed'),
    [orders]
  )

  const handleResolveDispute = async (
    orderId: string,
    status: 'completed' | 'cancelled' | 'active'
  ) => {
    setDisputeActionId(orderId)
    try {
      const updated = await api.adminResolveOrder(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setDisputeActionId(null)
    }
  }

  const handleWithdrawal = async (requestId: string, status: 'approved' | 'rejected') => {
    setWithdrawalActionId(requestId)
    try {
      const updated = await api.adminUpdateWithdrawal(requestId, status)
      setWithdrawals((prev) => prev.map((w) => (w.id === requestId ? updated : w)))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setWithdrawalActionId(null)
    }
  }

  const profileReady = !isAuthLoading && !profileLoading && (!isLoggedIn || profile !== null)

  if (!profileReady) {
    return <LoadingBlock className="py-10" />
  }

  if (!profile?.is_admin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--kwork-text)]">{t('admin_panel')}</h1>
        <p className="text-[var(--kwork-text-muted)]">{t('admin_access_denied')}</p>
        <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_name_not_role')}</p>
        {profile?.email && (
          <p className="rounded-lg border border-[var(--kwork-border)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--kwork-text-muted)]">
            {t('admin_setup_sql_hint').replace('{email}', profile.email)}
          </p>
        )}
        <Link href={dashboardPathForRole(currentUserRole)}>
          <Button variant="outline">{t('nav_dashboard')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="layout-container mx-auto max-w-6xl space-y-8 py-10">
      <h1 className="text-[24px] font-bold text-[var(--kwork-text)] sm:text-[28px]">{t('admin_panel')}</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: t('admin_users'), value: stats.users },
            { label: t('admin_orders'), value: stats.orders },
            { label: t('nav_services'), value: stats.services },
            { label: t('nav_projects'), value: stats.projects },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <p className="text-sm text-[var(--kwork-text-muted)]">{item.label}</p>
              <p className="text-2xl font-bold text-[var(--kwork-text)]">{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-[var(--kwork-text)]">{t('admin_users')}</h2>
          <Input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder={t('admin_search_ph')}
            className="max-w-xs"
          />
        </div>
        {users.length >= 100 && (
          <p className="mb-3 text-[12px] text-[var(--kwork-text-muted)]">
            {t('admin_users_limit_note').replace('{n}', '100')}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('admin_users')}</caption>
            <thead>
              <tr className="border-b border-[var(--kwork-border)] text-left">
                <th className="py-2 text-[var(--kwork-text-muted)]">{t('full_name')}</th>
                <th className="text-[var(--kwork-text-muted)]">{t('email')}</th>
                <th className="text-[var(--kwork-text-muted)]">{t('select_role')}</th>
                <th className="text-[var(--kwork-text-muted)]">{t('region')}</th>
                <th className="text-[var(--kwork-text-muted)]">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--kwork-text-muted)]">
                    {t('admin_users_empty')}
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-[var(--kwork-border)]">
                  <td className="py-2 text-[var(--kwork-text)]">{u.full_name ?? '—'}</td>
                  <td className="text-[var(--kwork-text-sub)]">{u.email ?? '—'}</td>
                  <td className="text-[var(--kwork-text-sub)]">{u.role}</td>
                  <td className="text-[var(--kwork-text-sub)]">{u.region ?? '—'}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userActionId === u.id || u.id === profile?.id}
                        onClick={async () => {
                          setUserActionId(u.id)
                          try {
                            const next = u.role === 'freelancer' ? 'client' : 'freelancer'
                            const updated = await api.adminUpdateUser(u.id, { role: next })
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
                          } catch (e) {
                            setError(e instanceof Error ? e.message : t('error_required'))
                          } finally {
                            setUserActionId(null)
                          }
                        }}
                      >
                        {t('admin_toggle_role')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userActionId === u.id || u.id === profile?.id || u.role !== 'freelancer'}
                        onClick={async () => {
                          setUserActionId(u.id)
                          try {
                            const updated = await api.adminUpdateUser(u.id, { is_verified: !u.is_verified })
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
                          } catch (e) {
                            setError(e instanceof Error ? e.message : t('error_required'))
                          } finally {
                            setUserActionId(null)
                          }
                        }}
                      >
                        {u.is_verified ? t('admin_unverify') : t('badge_verified')}
                      </Button>
                      <Button
                        variant={u.is_banned ? 'primary' : 'danger'}
                        size="sm"
                        disabled={userActionId === u.id || u.id === profile?.id}
                        onClick={async () => {
                          setUserActionId(u.id)
                          try {
                            const updated = await api.adminUpdateUser(u.id, { is_banned: !u.is_banned })
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
                          } catch (e) {
                            setError(e instanceof Error ? e.message : t('error_required'))
                          } finally {
                            setUserActionId(null)
                          }
                        }}
                      >
                        {u.is_banned ? t('admin_unban') : t('admin_ban')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold text-[var(--kwork-text)]">{t('admin_disputes')}</h2>
        {disputedOrders.length === 0 ? (
          <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_empty_disputes')}</p>
        ) : (
          <div className="space-y-2">
            {disputedOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[var(--kwork-text)]">
                    {o.services?.title ?? o.id.slice(0, 8)}
                  </span>
                  {o.dispute_reason && (
                    <p className="mt-1 line-clamp-2 text-[12px] text-[var(--kwork-text-muted)]">{o.dispute_reason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatPrice(o.amount)}</span>
                  {o.payment_status && <PaymentStatusBadge status={o.payment_status} />}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={disputeActionId === o.id}
                    onClick={() => handleResolveDispute(o.id, 'completed')}
                  >
                    {t('admin_resolve_complete')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disputeActionId === o.id}
                    onClick={() => handleResolveDispute(o.id, 'active')}
                  >
                    {t('admin_resolve_rework')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disputeActionId === o.id}
                    onClick={() => handleResolveDispute(o.id, 'cancelled')}
                  >
                    {t('admin_resolve_cancel')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold text-[var(--kwork-text)]">{t('nav_services')}</h2>
        {services.length === 0 ? (
          <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_empty_services')}</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] py-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium">
                  {s.title}
                  {s.is_hidden && (
                    <span className="ml-2 text-[11px] text-[var(--kwork-text-muted)]">({t('admin_hide_service')})</span>
                  )}
                </span>
                <span className="text-[var(--kwork-text-muted)]">{s.profiles?.full_name ?? '—'}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={serviceActionId === s.id}
                    onClick={async () => {
                      setServiceActionId(s.id)
                      try {
                        const updated = await api.adminUpdateService(s.id, { is_hidden: !s.is_hidden })
                        setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...updated } : x)))
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t('error_required'))
                      } finally {
                        setServiceActionId(null)
                      }
                    }}
                  >
                    {s.is_hidden ? t('admin_unhide_service') : t('admin_hide_service')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={serviceActionId === s.id}
                    onClick={async () => {
                      setServiceActionId(s.id)
                      try {
                        await api.adminDeleteService(s.id)
                        setServices((prev) => prev.filter((x) => x.id !== s.id))
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t('error_required'))
                      } finally {
                        setServiceActionId(null)
                      }
                    }}
                  >
                    {t('admin_delete_service')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold text-[var(--kwork-text)]">{t('admin_withdrawals')}</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_empty_withdrawals')}</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--kwork-text)]">
                    {w.profiles?.full_name ?? w.freelancer_id.slice(0, 8)}
                  </p>
                  <p className="text-[12px] text-[var(--kwork-text-muted)]">{w.profiles?.email ?? '—'}</p>
                </div>
                <span className="font-semibold">{formatPrice(w.amount)}</span>
                <span className="text-[var(--kwork-text-muted)]">{w.status}</span>
                {w.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={withdrawalActionId === w.id}
                      onClick={() => handleWithdrawal(w.id, 'approved')}
                    >
                      {t('admin_approve')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={withdrawalActionId === w.id}
                      onClick={() => handleWithdrawal(w.id, 'rejected')}
                    >
                      {t('admin_reject')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-[var(--kwork-text)]">{t('admin_orders')}</h2>
          <Input
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder={t('search_orders_ph')}
            className="max-w-xs"
          />
        </div>
        {orders.length >= 100 && (
          <p className="mb-3 text-[12px] text-[var(--kwork-text-muted)]">
            {t('admin_orders_limit_note').replace('{n}', '100')}
          </p>
        )}
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_orders_empty')}</p>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] py-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-[var(--kwork-text)]">
                  {o.services?.title ?? o.id.slice(0, 8)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  {o.payment_status && <PaymentStatusBadge status={o.payment_status} />}
                </div>
                <span className="font-semibold text-[var(--kwork-text)]">{formatPrice(o.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
