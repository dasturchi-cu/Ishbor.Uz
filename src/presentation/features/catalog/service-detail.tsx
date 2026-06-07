'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Star, MapPin } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiService } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { freelancerPath, PATHS } from '@/domain/constants/routes'

export function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const { t, isLoggedIn, currentUserRole, userId } = useApp()
  const router = useRouter()
  const [service, setService] = useState<ApiService | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getService(serviceId)
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false))
  }, [serviceId])

  const handleOrder = async () => {
    if (!isLoggedIn) {
      router.push(PATHS.login)
      return
    }
    if (currentUserRole !== 'client') {
      setError(t('client_only_order'))
      return
    }
    setOrdering(true)
    setError('')
    try {
      await api.createOrder(serviceId)
      router.push(PATHS.dashboardClient)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">...</div>
  }

  if (!service) {
    return <div className="p-10 text-center text-muted-foreground">{t('no_services_found')}</div>
  }

  const freelancerName = service.profiles?.full_name ?? 'Freelancer'
  const isOwnService = userId === service.freelancer_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Card className="p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold text-foreground">{service.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-primary"
                onClick={() => router.push(freelancerPath(service.freelancer_id))}
              >
                {freelancerName}
              </button>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {service.region}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {service.category}
              </span>
            </div>
            <p className="text-foreground leading-relaxed">{service.description}</p>
          </div>
          <div className="w-full md:w-64 shrink-0 space-y-3">
            <p className="text-sm text-muted-foreground">{t('starting_at')}</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(service.price)}</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!isOwnService && (
              <Button className="w-full" onClick={handleOrder} disabled={ordering}>
                {ordering ? '...' : t('order_now')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
