'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { DollarSign, Lock } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'

export function WalletPage() {
  const { t, currentUserRole } = useApp()
  const [orders, setOrders] = useState<ApiOrder[]>([])

  useEffect(() => {
    api.listOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  const { completed, active, pending } = useMemo(() => {
    let completed = 0
    let active = 0
    let pending = 0
    for (const o of orders) {
      if (o.status === 'completed') completed += o.amount
      else if (o.status === 'active' || o.status === 'delivered') active += o.amount
      else if (o.status === 'pending') pending += o.amount
    }
    return { completed, active, pending }
  }, [orders])

  const balance = currentUserRole === 'freelancer' ? completed : 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('wallet')}</h1>
        <p className="text-muted-foreground">{t('wallet_desc')}</p>
        <p className="text-sm text-muted-foreground mt-2">
          To&apos;lov (Click/Payme) keyingi bosqichda qo&apos;shiladi. Hozir faqat buyurtma summalari ko&apos;rsatiladi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">{t('available_balance')}</p>
          </div>
          <p className="text-3xl font-bold">{formatPrice(balance)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">{t('escrow_balance')}</p>
          </div>
          <p className="text-3xl font-bold">{formatPrice(active + pending)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">{t('total_earnings')}</p>
          <p className="text-3xl font-bold">{formatPrice(completed)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-bold mb-4">{t('nav_orders')}</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex justify-between text-sm border-b border-border/50 py-2">
              <span>{o.services?.title ?? o.id.slice(0, 8)}</span>
              <span>{o.status}</span>
              <span>{formatPrice(o.amount)}</span>
            </div>
          ))}
          {orders.length === 0 && <p className="text-muted-foreground text-sm">{t('no_orders_yet')}</p>}
        </div>
      </Card>
    </div>
  )
}
