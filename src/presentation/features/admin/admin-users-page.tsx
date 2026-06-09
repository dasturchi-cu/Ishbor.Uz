'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Ban,
  Bell,
  Download,
  PauseCircle,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminDataTable, type AdminColumn } from '@/presentation/components/admin/admin-data-table'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Alert } from '@/presentation/components/ui/alert'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminUser } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { formatDateShort } from '@/shared/lib/format-date'
import { downloadCsv } from '@/shared/lib/csv-export'
import { cn } from '@/shared/lib/utils'
import { useAdminSavedFilters } from '@/shared/lib/use-admin-saved-filters'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import { ConfirmModal } from '@/presentation/components/dashboard/confirm-modal'

type UserFilterPreset = 'all' | 'freelancer' | 'client' | 'verified' | 'unverified' | 'active' | 'suspended' | 'banned' | 'top_rated' | 'new_users'

interface UserFilters extends Record<string, unknown> {
  search: string
  preset: UserFilterPreset
  sort_by: 'created_at' | 'trust_score' | 'revenue' | 'orders_count'
  sort_dir: 'asc' | 'desc'
}

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  preset: 'all',
  sort_by: 'created_at',
  sort_dir: 'desc',
}

const PAGE_SIZE = 25

function presetToParams(preset: UserFilterPreset) {
  switch (preset) {
    case 'freelancer':
      return { role: 'freelancer' as const }
    case 'client':
      return { role: 'client' as const }
    case 'verified':
      return { is_verified: true }
    case 'unverified':
      return { is_verified: false }
    case 'banned':
      return { is_banned: true }
    case 'suspended':
      return { is_suspended: true }
    case 'top_rated':
      return { preset: 'top_rated' as const }
    case 'new_users':
      return { preset: 'new_users' as const }
    case 'active':
      return { preset: 'active' as const }
    default:
      return {}
  }
}

export function AdminUsersPage() {
  const { t, language } = useApp()
  const { authed, ready } = useAuthReady()
  const [filters, setFilters, resetFilters] = useAdminSavedFilters('users-v2', DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)
  const [users, setUsers] = useState<ApiAdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    action: () => Promise<void>
  } | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => window.clearTimeout(id)
  }, [filters.search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.adminUsers({
        limit: PAGE_SIZE,
        offset,
        search: debouncedSearch || undefined,
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
        ...presetToParams(filters.preset),
      })
      setUsers(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin_load_users_failed'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters, offset, t])

  useEffect(() => {
    if (!ready || !authed) return
    void load()
  }, [load, ready, authed])

  useEffect(() => {
    setOffset(0)
  }, [debouncedSearch, filters.preset, filters.sort_by, filters.sort_dir])

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      if (users.every((u) => prev.has(u.id))) return new Set()
      return new Set(users.map((u) => u.id))
    })
  }

  const runBulk = async (action: 'ban' | 'unban' | 'verify' | 'unverify' | 'suspend' | 'unsuspend') => {
    const ids = [...selected]
    if (!ids.length) return
    setBulkLoading(true)
    try {
      await api.adminBulkUsers({ user_ids: ids, action })
      setSelected(new Set())
      await load()
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setBulkLoading(false)
      setConfirmAction(null)
    }
  }

  const exportCsv = async () => {
    const res = await api.adminUsers({
      limit: 200,
      offset: 0,
      search: debouncedSearch || undefined,
      sort_by: filters.sort_by,
      sort_dir: filters.sort_dir,
      ...presetToParams(filters.preset),
    })
    downloadCsv(
      `ishbor-users-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Name', 'Email', 'Role', 'Trust', 'Orders', 'Revenue', 'Status', 'Registered'],
      res.items.map((u) => [
        u.full_name ?? '',
        u.email ?? '',
        u.role ?? '',
        String(u.trust_score ?? ''),
        String(u.orders_count ?? 0),
        String(u.revenue ?? 0),
        u.account_status ?? '',
        u.created_at ?? '',
      ])
    )
  }

  const columns = useMemo((): AdminColumn<ApiAdminUser>[] => {
    return [
      {
        id: 'user',
        header: t('admin_col_user'),
        cell: (u) => (
          <Link href={PATHS.adminUserDetail(u.id)} className="flex min-w-[180px] items-center gap-3 hover:opacity-90">
            <Avatar name={u.full_name ?? u.email ?? '?'} src={u.avatar_url} size={36} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.full_name ?? '—'}</p>
              <p className="truncate text-[12px] text-[var(--admin-muted)]">@{u.username ?? u.id.slice(0, 8)}</p>
            </div>
          </Link>
        ),
      },
      {
        id: 'contact',
        header: t('admin_col_contact'),
        cell: (u) => (
          <div className="min-w-[140px]">
            <p className="truncate">{u.email ?? '—'}</p>
            <p className="text-[12px] text-[var(--admin-muted)]">{u.phone ?? '—'}</p>
          </div>
        ),
      },
      {
        id: 'role',
        header: t('admin_col_type'),
        cell: (u) => (
          <span className="admin-badge admin-badge--neutral">
            {u.role === 'client' ? t('role_client_label') : t('role_freelancer_label')}
          </span>
        ),
      },
      {
        id: 'trust_score',
        header: t('admin_col_trust'),
        sortable: true,
        cell: (u) => (
          <span className={cn('font-semibold', (u.trust_score ?? 0) >= 70 && 'text-[var(--admin-success)]')}>
            {u.trust_score ?? '—'}
          </span>
        ),
      },
      {
        id: 'verification_status',
        header: t('admin_col_verification'),
        cell: (u) => (
          <span className={cn('admin-badge', u.is_verified ? 'admin-badge--success' : 'admin-badge--muted')}>
            {u.is_verified ? t('admin_verified') : t('admin_unverified')}
          </span>
        ),
      },
      {
        id: 'created_at',
        header: t('admin_col_registered'),
        sortable: true,
        cell: (u) => (u.created_at ? formatDateShort(new Date(u.created_at), language) : '—'),
      },
      {
        id: 'last_active_at',
        header: t('admin_col_last_active'),
        cell: (u) => (u.last_active_at ? formatDateShort(new Date(u.last_active_at), language) : '—'),
      },
      {
        id: 'orders_count',
        header: t('admin_col_orders'),
        sortable: true,
        cell: (u) => u.orders_count ?? 0,
      },
      {
        id: 'revenue',
        header: t('admin_col_revenue'),
        sortable: true,
        cell: (u) => formatPrice(u.revenue ?? 0),
      },
      {
        id: 'account_status',
        header: t('admin_col_status'),
        cell: (u) => {
          const status = u.account_status ?? 'active'
          return (
            <span
              className={cn(
                'admin-badge',
                status === 'banned' && 'admin-badge--danger',
                status === 'suspended' && 'admin-badge--warning',
                status === 'active' && 'admin-badge--success'
              )}
            >
              {t(`admin_status_${status}` as 'admin_status_active')}
            </span>
          )
        },
      },
    ]
  }, [language, t])

  const presetChips: { id: UserFilterPreset; label: string }[] = [
    { id: 'all', label: t('admin_filter_all') },
    { id: 'freelancer', label: t('role_freelancer_label') },
    { id: 'client', label: t('role_client_label') },
    { id: 'verified', label: t('admin_verified') },
    { id: 'unverified', label: t('admin_unverified') },
    { id: 'active', label: t('admin_filter_active') },
    { id: 'suspended', label: t('admin_filter_suspended') },
    { id: 'banned', label: t('admin_filter_banned') },
    { id: 'top_rated', label: t('admin_filter_top_rated') },
    { id: 'new_users', label: t('admin_filter_new') },
  ]

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <AdminLayout onRefresh={() => void load()} refreshing={loading}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="admin-sticky-toolbar mb-4 space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t('admin_users_search_ph')}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
              <Download className="mr-1.5 size-3.5" />
              {t('admin_export_csv')}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {t('admin_reset_filters')}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {presetChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilters({ ...filters, preset: chip.id })}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                filters.preset === chip.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--admin-bg)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] pt-3">
            <span className="text-[13px] font-medium text-[var(--admin-text)]">
              {t('admin_selected_count').replace('{n}', String(selected.size))}
            </span>
            <Button variant="outline" size="sm" loading={bulkLoading} onClick={() => void runBulk('verify')}>
              <ShieldCheck className="mr-1 size-3.5" /> {t('admin_bulk_verify')}
            </Button>
            <Button variant="outline" size="sm" loading={bulkLoading} onClick={() => void runBulk('suspend')}>
              <PauseCircle className="mr-1 size-3.5" /> {t('admin_bulk_suspend')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={bulkLoading}
              onClick={() =>
                setConfirmAction({
                  title: t('admin_bulk_ban_confirm'),
                  action: () => runBulk('ban'),
                })
              }
            >
              <Ban className="mr-1 size-3.5" /> {t('admin_bulk_ban')}
            </Button>
            <Button variant="outline" size="sm" loading={bulkLoading} onClick={() => void runBulk('unban')}>
              <UserCheck className="mr-1 size-3.5" /> {t('admin_bulk_unban')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const title = window.prompt(t('admin_notify_title_ph'))
                if (!title) return
                const body = window.prompt(t('admin_notify_body_ph')) ?? title
                void api.adminBulkNotifyUsers({ user_ids: [...selected], title, body }).then(() => load())
              }}
            >
              <Bell className="mr-1 size-3.5" /> {t('admin_bulk_notify')}
            </Button>
          </div>
        )}
      </div>

      <AdminDataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        sortBy={filters.sort_by}
        sortDir={filters.sort_dir}
        onSort={(col) => {
          if (filters.sort_by === col) {
            setFilters({ ...filters, sort_dir: filters.sort_dir === 'asc' ? 'desc' : 'asc' })
          } else {
            setFilters({ ...filters, sort_by: col as UserFilters['sort_by'], sort_dir: 'desc' })
          }
        }}
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        loading={loading}
        emptyLabel={t('admin_users_empty')}
      />

      <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--admin-muted)]">
        <span>{t('admin_pagination_total').replace('{n}', String(total))}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
            {t('admin_prev_page')}
          </Button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            {t('admin_next_page')}
          </Button>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          open
          title={confirmAction.title}
          onConfirm={() => void confirmAction.action()}
          onCancel={() => setConfirmAction(null)}
          danger
        />
      )}
    </AdminLayout>
  )
}
