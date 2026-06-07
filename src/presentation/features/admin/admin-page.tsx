'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminStats, ApiOrder, ApiProfile } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'

export function AdminPage() {
  const { t, profile } = useApp()
  const router = useRouter()
  const [stats, setStats] = useState<ApiAdminStats | null>(null)
  const [users, setUsers] = useState<ApiProfile[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.replace(PATHS.home)
      return
    }
    if (!profile?.is_admin) return

    Promise.all([api.adminStats(), api.adminUsers(), api.adminOrders()])
      .then(([s, u, o]) => {
        setStats(s)
        setUsers(u)
        setOrders(o)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Xatolik'))
  }, [profile, router])

  if (!profile?.is_admin) {
    return <div className="p-10 text-center text-muted-foreground">...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold">{t('admin_panel')}</h1>
      {error && <p className="text-destructive text-sm">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('admin_users'), value: stats.users },
            { label: t('admin_orders'), value: stats.orders },
            { label: t('nav_services'), value: stats.services },
            { label: t('nav_projects'), value: stats.projects },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-bold mb-4">{t('admin_users')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Ism</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Viloyat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-2">{u.full_name ?? '—'}</td>
                  <td>{u.email ?? '—'}</td>
                  <td>{u.role}</td>
                  <td>{u.region ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4">{t('admin_orders')}</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex justify-between text-sm border-b border-border/50 py-2">
              <span>{o.services?.title ?? o.id.slice(0, 8)}</span>
              <span>{o.status}</span>
              <span>{o.amount.toLocaleString()} so'm</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
