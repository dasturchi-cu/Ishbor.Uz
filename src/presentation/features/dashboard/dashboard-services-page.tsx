'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiService } from '@/infrastructure/api/types'
import { PATHS, servicePath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { orderCountForService } from '@/shared/lib/order-analytics'
import type { TranslationKey } from '@/infrastructure/i18n'
import { AdminPanelBanner } from '@/presentation/components/layout/admin-panel-banner'
import { Alert } from '@/presentation/components/ui/alert'
import { toast } from '@/presentation/components/ui/toast'

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
}

export function DashboardServicesPage() {
  const { t } = useApp()
  const router = useRouter()
  const [services, setServices] = useState<ApiService[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const loadServices = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([
      api.listMyServices().catch(() => {
        setLoadError(true)
        return [] as ApiService[]
      }),
      api.listOrders().catch(() => [] as ApiOrder[]),
    ])
      .then(([svc, ord]) => {
        setServices(svc)
        setOrders(ord)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadServices()
  }, [])

  const orderCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of services) {
      map.set(s.id, orderCountForService(orders, s.id))
    }
    return map
  }, [services, orders])

  const categoryLabel = (cat: string) => {
    const key = CATEGORY_KEYS[cat]
    return key ? t(key) : cat
  }

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm(t('service_delete_confirm'))) return
    setDeletingId(serviceId)
    try {
      await api.deleteService(serviceId)
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      toast.success(t('service_deleted'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditStart = (service: ApiService) => {
    setEditingId(service.id)
    setEditTitle(service.title)
  }

  const handleEditSave = async (serviceId: string) => {
    const title = editTitle.trim()
    if (title.length < 3) {
      toast.error(t('error_title_short'))
      return
    }
    setEditingId(serviceId)
    try {
      const updated = await api.updateService(serviceId, { title })
      setServices((prev) => prev.map((s) => (s.id === serviceId ? updated : s)))
      setEditingId(null)
      toast.success(t('service_updated'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    }
  }

  return (
    <div>
      <AdminPanelBanner className="mb-5" />
      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={loadServices}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="dashboard-page-title flex items-center gap-2">
          {t('my_services_title')}
          <Badge variant="primary">{services.length}</Badge>
        </h2>
        <Link href={PATHS.dashboardServicesNew}>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            {t('nav_new_service')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)]">
          <EmptyState
            icon={<Package />}
            title={t('no_services_dashboard')}
            description={t('no_services_dashboard_desc')}
            action={{ label: t('first_service_btn'), onClick: () => router.push(PATHS.dashboardServicesNew) }}
          />
        </div>
      ) : (
        <>
        <div className="show-mobile space-y-3">
          {services.map((s) => (
            <div key={s.id} className="dashboard-service-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingId === s.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-md border border-[var(--kwork-border)] px-2 py-1.5 text-[13px]"
                    />
                  ) : (
                    <Link href={servicePath(s.id)} className="text-[14px] font-semibold text-[var(--kwork-text)] hover:text-[var(--color-primary)]">
                      {s.title}
                    </Link>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="default">{categoryLabel(s.category)}</Badge>
                    <Badge variant="success">{t('service_status_active')}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {editingId === s.id ? (
                    <Button variant="primary" size="sm" onClick={() => handleEditSave(s.id)}>
                      {t('save')}
                    </Button>
                  ) : (
                    <Link
                      href={PATHS.dashboardServiceEdit(s.id)}
                      className="flex h-10 w-10 items-center justify-center text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]"
                      aria-label={t('edit_service')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                    className="flex h-10 w-10 items-center justify-center text-[var(--kwork-text-muted)] hover:text-[var(--error)] disabled:opacity-50"
                    aria-label={t('delete_service')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--kwork-border)] pt-3 text-[13px]">
                <span className="font-semibold text-[var(--kwork-text)]">
                  {t('from_price').replace('{price}', formatPrice(s.price))}
                </span>
                <span className="text-[var(--kwork-text-muted)]">
                  {t('col_orders_count')}:{' '}
                  <span className="font-semibold text-[var(--color-primary)]">{orderCounts.get(s.id) ?? 0}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="hide-mobile overflow-hidden rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--kwork-border)] text-[11px] font-semibold uppercase text-[var(--kwork-text-muted)]">
                <th className="px-4 py-3">{t('col_service')}</th>
                <th className="hide-mobile px-4 py-3">{t('col_category')}</th>
                <th className="px-4 py-3">{t('col_price')}</th>
                <th className="hide-mobile px-4 py-3">{t('col_orders_count')}</th>
                <th className="px-4 py-3">{t('col_status')}</th>
                <th className="px-4 py-3">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-[var(--kwork-border)] last:border-b-0 hover:bg-[var(--neutral-50)]">
                  <td className="px-4 py-3 font-semibold">
                    {editingId === s.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-md border border-[var(--kwork-border)] px-2 py-1 text-[13px]"
                      />
                    ) : (
                      <Link href={servicePath(s.id)} className="hover:text-[var(--color-primary)]">
                        {s.title}
                      </Link>
                    )}
                  </td>
                  <td className="hide-mobile px-4 py-3">
                    <Badge variant="default">{categoryLabel(s.category)}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {t('from_price').replace('{price}', formatPrice(s.price))}
                  </td>
                  <td className="hide-mobile px-4 py-3 font-semibold text-[var(--color-primary)]">
                    {orderCounts.get(s.id) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{t('service_status_active')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {editingId === s.id ? (
                        <Button variant="primary" size="sm" onClick={() => handleEditSave(s.id)}>
                          {t('save')}
                        </Button>
                      ) : (
                        <Link
                          href={PATHS.dashboardServiceEdit(s.id)}
                          className="text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]"
                          aria-label={t('edit_service')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={deletingId === s.id}
                        onClick={() => handleDelete(s.id)}
                        className="text-[var(--kwork-text-muted)] hover:text-[var(--error)] disabled:opacity-50"
                        aria-label={t('delete_service')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
