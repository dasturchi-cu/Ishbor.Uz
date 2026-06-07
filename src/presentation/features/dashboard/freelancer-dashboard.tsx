'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { DollarSign, Users, Star, CheckCircle2 } from 'lucide-react'
import { OrdersList } from '@/presentation/features/orders/orders-list'
import { PATHS, servicePath } from '@/domain/constants/routes'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiService } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'

const ACTIVE_STATUSES = new Set(['pending', 'active', 'delivered'])

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function statFmt(template: string, n: number): string {
  return template.replace('{n}', String(n))
}

export function FreelancerDashboard() {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = profile?.full_name || t('role_freelancer')

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [services, setServices] = useState<ApiService[]>([])
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 })
  const [showCreatedBanner, setShowCreatedBanner] = useState(false)

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedBanner(true)
      router.replace(PATHS.dashboardFreelancer)
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      api.listOrders().catch(() => [] as ApiOrder[]),
      api.getFreelancerReviewStats(userId).catch(() => ({ average: 0, count: 0 })),
      api.listMyServices().catch(() => [] as ApiService[]),
    ])
      .then(([ordersData, stats, servicesData]) => {
        setOrders(ordersData)
        setReviewStats(stats)
        setServices(servicesData)
      })
      .finally(() => setLoading(false))
  }, [userId])

  const metrics = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed')
    const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status))
    const earnings = completed.reduce((sum, o) => sum + o.amount, 0)
    const ordersThisMonth = orders.filter((o) => isThisMonth(o.created_at)).length

    const reviewsFoot =
      reviewStats.count > 0
        ? statFmt(t('stat_n_reviews'), reviewStats.count)
        : t('stat_no_reviews')

    return {
      earnings: earnings > 0 ? formatPrice(earnings) : '0 so\'m',
      earningsFoot: reviewsFoot,
      activeCount: String(active.length),
      activeFoot:
        ordersThisMonth > 0
          ? statFmt(t('stat_n_this_month'), ordersThisMonth)
          : t('stat_no_data'),
      rating: reviewStats.average > 0 ? reviewStats.average.toFixed(1) : '—',
      ratingFoot: reviewsFoot,
      completedCount: String(completed.length),
      completedFoot:
        services.length > 0
          ? statFmt(t('stat_n_services'), services.length)
          : t('stat_no_data'),
    }
  }, [orders, reviewStats, services.length, t])

  const stats: {
    icon: typeof DollarSign
    label: TranslationKey
    value: string
    change: string
  }[] = [
    {
      icon: DollarSign,
      label: 'total_earnings',
      value: loading ? '…' : metrics.earnings,
      change: loading ? '' : metrics.earningsFoot,
    },
    {
      icon: Users,
      label: 'active_projects',
      value: loading ? '…' : metrics.activeCount,
      change: loading ? '' : metrics.activeFoot,
    },
    {
      icon: Star,
      label: 'rating',
      value: loading ? '…' : metrics.rating,
      change: loading ? '' : metrics.ratingFoot,
    },
    {
      icon: CheckCircle2,
      label: 'projects_completed',
      value: loading ? '…' : metrics.completedCount,
      change: loading ? '' : metrics.completedFoot,
    },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {showCreatedBanner && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {t('service_created')}
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t('freelancer_dashboard')}</h1>
            <p className="text-muted-foreground">
              {t('welcome_back')}, {name}!
            </p>
          </div>
          <Link href={PATHS.createService}>
            <Button>{t('create_service_title')}</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t(stat.label)}</p>
                    <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{stat.value}</p>
                    {stat.change && (
                      <p className="text-xs text-primary mt-2">{stat.change}</p>
                    )}
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-6 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{t('nav_my_services')}</h2>
            <Link href={PATHS.createService}>
              <Button size="sm">{t('create_service_title')}</Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">{t('loading_data')}</p>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('no_services_yet')}</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const categoryKey = CATEGORY_KEYS[service.category]
                return (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.region}
                        {categoryKey ? ` · ${t(categoryKey)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-foreground">{formatPrice(service.price)}</p>
                      <Button size="sm" variant="outline" onClick={() => router.push(servicePath(service.id))}>
                        {t('view')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('nav_orders')}</h2>
          <OrdersList role="freelancer" />
        </Card>
      </div>
    </div>
  )
}
