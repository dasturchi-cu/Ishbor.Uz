'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Star } from 'lucide-react'
import { PATHS, freelancerPath } from '@/domain/constants/routes'
import { OrdersList } from '@/presentation/features/orders/orders-list'
import { api } from '@/infrastructure/api/client'
import type { ApiProfilePublic, ApiProject } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'

export function ClientDashboard() {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [freelancers, setFreelancers] = useState<ApiProfilePublic[]>([])

  useEffect(() => {
    if (userId) {
      api.listProjects({ client_id: userId }).then(setProjects).catch(() => setProjects([]))
    }
    api.listFreelancers().then(setFreelancers).catch(() => setFreelancers([]))
  }, [userId])

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('client_dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('manage_projects')}{profile?.full_name ? ` — ${profile.full_name}` : ''}
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('nav_orders')}</h2>
            <Button onClick={() => router.push(PATHS.services)}>{t('browse_services')}</Button>
          </div>
          <OrdersList role="client" />
        </Card>

        <Card className="p-6 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('my_projects')}</h2>
            <Button onClick={() => router.push(PATHS.postProject)}>{t('post_new_project')}</Button>
          </div>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('no_orders_yet')}</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.region} · {formatPrice(p.budget)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{t('recommended_freelancers')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {freelancers.map((f) => (
              <Card key={f.id} className="p-4">
                <h3 className="font-semibold">{f.full_name ?? 'Freelancer'}</h3>
                <p className="text-xs text-muted-foreground mb-2">{f.specialty ?? f.region}</p>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm">{f.avg_rating ?? 0} ({f.review_count ?? 0})</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => router.push(freelancerPath(f.id))}>
                  {t('view')}
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
