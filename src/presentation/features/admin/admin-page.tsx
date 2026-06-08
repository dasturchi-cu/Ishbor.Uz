'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminStats, ApiOrder, ApiProfile, ApiService, ApiWaitlistEntry, ApiWithdrawalRequest } from '@/infrastructure/api/types'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { downloadCsv } from '@/shared/lib/csv-export'

const ADMIN_PAGE_SIZE = 50
const ADMIN_EXPORT_PAGE_SIZE = 200

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
  const [usersTotal, setUsersTotal] = useState(0)
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0)
  const [usersLoadingMore, setUsersLoadingMore] = useState(false)
  const [ordersLoadingMore, setOrdersLoadingMore] = useState(false)
  const [withdrawalsLoadingMore, setWithdrawalsLoadingMore] = useState(false)
  const [disputedOrders, setDisputedOrders] = useState<ApiOrder[]>([])
  const [disputesTotal, setDisputesTotal] = useState(0)
  const [waitlist, setWaitlist] = useState<ApiWaitlistEntry[]>([])
  const [waitlistTotal, setWaitlistTotal] = useState(0)
  const [exporting, setExporting] = useState<'users' | 'orders' | 'waitlist' | 'disputes' | 'services' | null>(null)

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
      const [statsRes, usersRes, ordersRes, withdrawalsRes, servicesRes, disputesRes, waitlistRes] = await Promise.allSettled([
        api.adminStats(),
        api.adminUsers({ limit: ADMIN_PAGE_SIZE, offset: 0 }),
        api.adminOrders({ limit: ADMIN_PAGE_SIZE, offset: 0 }),
        api.adminWithdrawals({ limit: ADMIN_PAGE_SIZE, offset: 0 }),
        api.adminListServices({ limit: 30 }),
        api.adminDisputes({ limit: ADMIN_PAGE_SIZE, offset: 0 }),
        api.adminWaitlist({ limit: ADMIN_PAGE_SIZE, offset: 0 }),
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
        setUsers(usersRes.value.items)
        setUsersTotal(usersRes.value.total)
      } else {
        failures.push(
          usersRes.reason instanceof Error ? usersRes.reason.message : t('admin_load_users_failed')
        )
      }

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value.items)
        setOrdersTotal(ordersRes.value.total)
      } else {
        failures.push(
          ordersRes.reason instanceof Error ? ordersRes.reason.message : t('admin_load_orders_failed')
        )
      }

      if (withdrawalsRes.status === 'fulfilled') {
        setWithdrawals(withdrawalsRes.value.items)
        setWithdrawalsTotal(withdrawalsRes.value.total)
      } else {
        failures.push(
          withdrawalsRes.reason instanceof Error
            ? withdrawalsRes.reason.message
            : t('admin_load_withdrawals_failed')
        )
      }

      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value)
      } else {
        failures.push(
          servicesRes.reason instanceof Error
            ? servicesRes.reason.message
            : t('admin_load_services_failed')
        )
      }

      if (disputesRes.status === 'fulfilled') {
        setDisputedOrders(disputesRes.value.items)
        setDisputesTotal(disputesRes.value.total)
      } else {
        failures.push(
          disputesRes.reason instanceof Error
            ? disputesRes.reason.message
            : t('admin_load_orders_failed')
        )
      }

      if (waitlistRes.status === 'fulfilled') {
        setWaitlist(waitlistRes.value.items)
        setWaitlistTotal(waitlistRes.value.total)
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

  const handleResolveDispute = async (
    orderId: string,
    status: 'completed' | 'cancelled' | 'active'
  ) => {
    setDisputeActionId(orderId)
    try {
      const updated = await api.adminResolveOrder(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      setDisputedOrders((prev) => prev.filter((o) => o.id !== orderId))
      setDisputesTotal((prev) => Math.max(0, prev - 1))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setDisputeActionId(null)
    }
  }

  const loadMoreUsers = async () => {
    setUsersLoadingMore(true)
    try {
      const res = await api.adminUsers({ limit: ADMIN_PAGE_SIZE, offset: users.length })
      setUsers((prev) => [...prev, ...res.items])
      setUsersTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setUsersLoadingMore(false)
    }
  }

  const loadMoreOrders = async () => {
    setOrdersLoadingMore(true)
    try {
      const res = await api.adminOrders({ limit: ADMIN_PAGE_SIZE, offset: orders.length })
      setOrders((prev) => [...prev, ...res.items])
      setOrdersTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setOrdersLoadingMore(false)
    }
  }

  const loadMoreWithdrawals = async () => {
    setWithdrawalsLoadingMore(true)
    try {
      const res = await api.adminWithdrawals({ limit: ADMIN_PAGE_SIZE, offset: withdrawals.length })
      setWithdrawals((prev) => [...prev, ...res.items])
      setWithdrawalsTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setWithdrawalsLoadingMore(false)
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

  const fetchAllAdminUsers = async () => {
    const all: ApiProfile[] = []
    let offset = 0
    while (true) {
      const res = await api.adminUsers({ limit: ADMIN_EXPORT_PAGE_SIZE, offset })
      all.push(...res.items)
      if (all.length >= res.total || res.items.length === 0) break
      offset += ADMIN_EXPORT_PAGE_SIZE
    }
    return all
  }

  const fetchAllAdminOrders = async () => {
    const all: ApiOrder[] = []
    let offset = 0
    while (true) {
      const res = await api.adminOrders({ limit: ADMIN_EXPORT_PAGE_SIZE, offset })
      all.push(...res.items)
      if (all.length >= res.total || res.items.length === 0) break
      offset += ADMIN_EXPORT_PAGE_SIZE
    }
    return all
  }

  const fetchAllAdminWaitlist = async () => {
    const all: ApiWaitlistEntry[] = []
    let offset = 0
    while (true) {
      const res = await api.adminWaitlist({ limit: ADMIN_EXPORT_PAGE_SIZE, offset })
      all.push(...res.items)
      if (all.length >= res.total || res.items.length === 0) break
      offset += ADMIN_EXPORT_PAGE_SIZE
    }
    return all
  }

  const handleExportUsers = async () => {
    setExporting('users')
    setError('')
    try {
      const rows = await fetchAllAdminUsers()
      downloadCsv(
        'ishbor-users.csv',
        [t('full_name'), t('email'), t('select_role'), t('region'), t('date'), 'is_verified', 'is_banned'],
        rows.map((u) => [
          u.full_name ?? '',
          u.email ?? '',
          u.role,
          u.region ?? '',
          u.created_at?.slice(0, 10) ?? '',
          String(!!u.is_verified),
          String(!!u.is_banned),
        ])
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportOrders = async () => {
    setExporting('orders')
    setError('')
    try {
      const rows = await fetchAllAdminOrders()
      downloadCsv(
        'ishbor-orders.csv',
        ['id', 'status', 'amount', 'payment_status', 'client_id', 'freelancer_id', t('date')],
        rows.map((o) => [
          o.id,
          o.status,
          String(o.amount),
          o.payment_status ?? '',
          o.client_id,
          o.freelancer_id,
          o.created_at?.slice(0, 10) ?? '',
        ])
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportWaitlist = async () => {
    setExporting('waitlist')
    setError('')
    try {
      const rows = await fetchAllAdminWaitlist()
      downloadCsv(
        'ishbor-waitlist.csv',
        [t('email'), t('admin_waitlist_source'), t('date')],
        rows.map((w) => [w.email, w.source, w.created_at?.slice(0, 10) ?? ''])
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setExporting(null)
    }
  }

  const fetchAllAdminDisputes = async () => {
    const all: ApiOrder[] = []
    let offset = 0
    while (true) {
      const res = await api.adminDisputes({ limit: ADMIN_EXPORT_PAGE_SIZE, offset })
      all.push(...res.items)
      if (all.length >= res.total || res.items.length === 0) break
      offset += ADMIN_EXPORT_PAGE_SIZE
    }
    return all
  }

  const fetchAllAdminServices = async () => {
    const all: ApiService[] = []
    let offset = 0
    while (true) {
      const batch = await api.adminListServices({ limit: ADMIN_EXPORT_PAGE_SIZE, offset })
      all.push(...batch)
      if (batch.length < ADMIN_EXPORT_PAGE_SIZE) break
      offset += ADMIN_EXPORT_PAGE_SIZE
    }
    return all
  }

  const handleExportDisputes = async () => {
    setExporting('disputes')
    setError('')
    try {
      const rows = await fetchAllAdminDisputes()
      downloadCsv(
        'ishbor-disputes.csv',
        ['id', 'status', 'amount', 'payment_status', 'dispute_reason', 'client_id', 'freelancer_id', t('date')],
        rows.map((o) => [
          o.id,
          o.status,
          String(o.amount),
          o.payment_status ?? '',
          o.dispute_reason ?? '',
          o.client_id,
          o.freelancer_id,
          o.created_at?.slice(0, 10) ?? '',
        ])
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportServices = async () => {
    setExporting('services')
    setError('')
    try {
      const rows = await fetchAllAdminServices()
      downloadCsv(
        'ishbor-services.csv',
        ['id', 'title', 'category', 'price', 'delivery_days', 'freelancer', 'is_hidden', t('date')],
        rows.map((s) => [
          s.id,
          s.title,
          s.category,
          String(s.price),
          String(s.delivery_days ?? ''),
          s.profiles?.full_name ?? '',
          String(!!s.is_hidden),
          s.created_at?.slice(0, 10) ?? '',
        ])
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setExporting(null)
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
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={PATHS.home}>
            <Button variant="outline">{t('nav_home')}</Button>
          </Link>
          <Link href={dashboardPathForRole(currentUserRole)}>
            <Button variant="primary">{t('nav_dashboard')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="layout-container mx-auto max-w-6xl space-y-8 py-10">
      <h1 className="text-[24px] font-bold text-[var(--kwork-text)] sm:text-[28px]">{t('admin_panel')}</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {[
            { label: t('admin_users'), value: stats.users },
            { label: t('admin_orders'), value: stats.orders },
            { label: t('nav_services'), value: stats.services },
            { label: t('nav_projects'), value: stats.projects },
            { label: t('admin_disputes'), value: stats.disputed_orders ?? disputesTotal },
            { label: t('admin_stat_withdrawals'), value: stats.pending_withdrawals ?? 0 },
            { label: t('admin_stat_banned'), value: stats.banned_users ?? 0 },
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={exporting === 'users'}
              onClick={handleExportUsers}
            >
              {exporting === 'users' ? t('admin_exporting') : t('admin_export_csv')}
            </Button>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('admin_search_ph')}
              className="max-w-xs"
            />
          </div>
        </div>
        {usersTotal > 0 && (
          <p className="mb-3 text-[12px] text-[var(--kwork-text-muted)]">
            {t('admin_showing_count').replace('{shown}', String(users.length)).replace('{total}', String(usersTotal))}
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
        {users.length < usersTotal && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" loading={usersLoadingMore} onClick={loadMoreUsers}>
              {t('admin_load_more')}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-[var(--kwork-text)]">
            {t('admin_disputes')}
            {disputesTotal > 0 && (
              <span className="ml-2 text-[13px] font-normal text-[var(--kwork-text-muted)]">
                ({disputesTotal})
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            loading={exporting === 'disputes'}
            disabled={disputesTotal === 0}
            onClick={handleExportDisputes}
          >
            {exporting === 'disputes' ? t('admin_exporting') : t('admin_export_csv')}
          </Button>
        </div>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-[var(--kwork-text)]">{t('nav_services')}</h2>
          <Button
            variant="outline"
            size="sm"
            loading={exporting === 'services'}
            disabled={services.length === 0}
            onClick={handleExportServices}
          >
            {exporting === 'services' ? t('admin_exporting') : t('admin_export_csv')}
          </Button>
        </div>
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
        {withdrawals.length < withdrawalsTotal && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" loading={withdrawalsLoadingMore} onClick={loadMoreWithdrawals}>
              {t('admin_load_more')}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-[var(--kwork-text)]">
            {t('admin_waitlist')}
            {waitlistTotal > 0 && (
              <span className="ml-2 text-[13px] font-normal text-[var(--kwork-text-muted)]">
                ({waitlistTotal})
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            loading={exporting === 'waitlist'}
            disabled={waitlistTotal === 0}
            onClick={handleExportWaitlist}
          >
            {exporting === 'waitlist' ? t('admin_exporting') : t('admin_export_csv')}
          </Button>
        </div>
        {waitlist.length === 0 ? (
          <p className="text-sm text-[var(--kwork-text-muted)]">{t('admin_waitlist_empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('admin_waitlist')}</caption>
              <thead>
                <tr className="border-b border-[var(--kwork-border)] text-left">
                  <th className="py-2 text-[var(--kwork-text-muted)]">{t('email')}</th>
                  <th className="text-[var(--kwork-text-muted)]">{t('admin_waitlist_source')}</th>
                  <th className="text-[var(--kwork-text-muted)]">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--kwork-border)]">
                    <td className="py-2 text-[var(--kwork-text)]">{row.email}</td>
                    <td className="text-[var(--kwork-text-sub)]">{row.source}</td>
                    <td className="text-[var(--kwork-text-muted)]">
                      {row.created_at ? row.created_at.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-[var(--kwork-text)]">{t('admin_orders')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={exporting === 'orders'}
              onClick={handleExportOrders}
            >
              {exporting === 'orders' ? t('admin_exporting') : t('admin_export_csv')}
            </Button>
            <Input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder={t('search_orders_ph')}
              className="max-w-xs"
            />
          </div>
        </div>
        {ordersTotal > 0 && (
          <p className="mb-3 text-[12px] text-[var(--kwork-text-muted)]">
            {t('admin_showing_count').replace('{shown}', String(orders.length)).replace('{total}', String(ordersTotal))}
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
        {orders.length < ordersTotal && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" loading={ordersLoadingMore} onClick={loadMoreOrders}>
              {t('admin_load_more')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
