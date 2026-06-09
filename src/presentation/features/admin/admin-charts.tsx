'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPrice } from '@/shared/lib/format'
import type { ApiAdminAnalytics } from '@/infrastructure/api/types'

export function AdminCharts({
  analytics,
  usersLabel,
  revenueLabel,
  commissionLabel,
  emptyLabel,
}: {
  analytics: ApiAdminAnalytics
  usersLabel: string
  revenueLabel: string
  commissionLabel: string
  emptyLabel: string
}) {
  const usersData = analytics.users_series ?? []
  const revenueData = analytics.revenue_series ?? []
  const commissionData = analytics.commission_series ?? []
  const usersEmpty = usersData.every((point) => point.value === 0)
  const revenueEmpty = revenueData.every((point) => point.value === 0)
  const commissionEmpty = commissionData.every((point) => point.value === 0)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-[var(--admin-border)] p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {usersLabel}
        </p>
        <div className="h-[220px]">
          {usersEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">
              {emptyLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--admin-border)] p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {revenueLabel}
        </p>
        <div className="h-[220px]">
          {revenueEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">
              {emptyLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}K`} width={36} />
                <Tooltip formatter={(v) => formatPrice(Number(v ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="url(#adminRevFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--admin-border)] p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {commissionLabel}
        </p>
        <div className="h-[220px]">
          {commissionEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">
              {emptyLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}K`} width={36} />
                <Tooltip formatter={(v) => formatPrice(Number(v ?? 0))} />
                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
