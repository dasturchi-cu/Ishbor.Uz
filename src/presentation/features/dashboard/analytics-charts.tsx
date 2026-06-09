'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPrice } from '@/shared/lib/format'

type ChartPoint = { date: string; amount: number }
type PiePoint = { name: string; value: number; color: string }
type RegionPoint = { region: string; pct: number }

export function AnalyticsCharts({
  chartData,
  pieData,
  regions,
  emptyLabel,
  revenueTitle,
  statusTitle,
  geoTitle,
}: {
  chartData: ChartPoint[]
  pieData: PiePoint[]
  regions: RegionPoint[]
  emptyLabel: string
  revenueTitle: string
  statusTitle: string
  geoTitle: string
}) {
  return (
    <>
      <div className="surface-panel mt-5 p-5">
        <h3 className="settings-section-title mb-4">{revenueTitle}</h3>
        <div className="h-[280px]">
          {chartData.every((d) => d.amount === 0) ? (
            <div className="flex h-full items-center justify-center text-[13px] text-[var(--ishbor-text-muted)]">
              {emptyLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ishbor-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                <Tooltip formatter={(v) => formatPrice(Number(v ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <h3 className="settings-section-title mb-4">{statusTitle}</h3>
          <div className="h-[200px]">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-[var(--ishbor-text-muted)]">
                {emptyLabel}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80}>
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="surface-panel p-5">
          <h3 className="settings-section-title mb-4">{geoTitle}</h3>
          {regions.length === 0 ? (
            <p className="text-[13px] text-[var(--ishbor-text-muted)]">{emptyLabel}</p>
          ) : (
            <ul className="space-y-3 text-[13px]">
              {regions.map(({ region, pct }) => (
                <li key={region} className="flex justify-between">
                  <span>{region}</span>
                  <span className="font-semibold text-[var(--color-primary)]">{pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
