'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import type { ApiProject, ApiService } from '@/infrastructure/api/types'
import {
  syncSavedFreelancersFromApi,
  syncSavedProjectsFromApi,
  syncSavedServicesFromApi,
} from '@/shared/lib/saved-items'
import { servicePath, freelancerPath, projectPath } from '@/domain/constants/routes'
import { initialsFromName } from '@/shared/lib/avatar'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

type SavedTab = 'services' | 'freelancers' | 'projects'

export function DashboardSavedPage() {
  const { t } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<SavedTab>('services')
  const [services, setServices] = useState<ApiService[]>([])
  const [freelancers, setFreelancers] = useState<Awaited<ReturnType<typeof api.listFreelancers>>>([])
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([syncSavedServicesFromApi(), syncSavedFreelancersFromApi(), syncSavedProjectsFromApi()])
      .then(([serviceIds, freelancerIds, projectIds]) =>
        Promise.all([
          serviceIds.length
            ? Promise.all(serviceIds.map((id) => api.getService(id).catch(() => null))).then(
                (r) => r.filter(Boolean) as ApiService[]
              )
            : Promise.resolve([]),
          freelancerIds.length
            ? api.listFreelancers().then((list) => list.filter((f) => freelancerIds.includes(f.id)))
            : Promise.resolve([]),
          projectIds.length
            ? api.listSavedProjects().then((rows) =>
                rows.map((r) => r.projects).filter(Boolean) as ApiProject[]
              )
            : Promise.resolve([]),
        ])
      )
      .then(([svc, fr, pr]) => {
        setServices(svc)
        setFreelancers(fr)
        setProjects(pr)
      })
      .finally(() => setLoading(false))
  }, [tab])

  const hasItems =
    tab === 'services' ? services.length > 0 : tab === 'freelancers' ? freelancers.length > 0 : projects.length > 0

  const tabLabel: Record<SavedTab, string> = {
    services: t('saved_services_tab'),
    freelancers: t('saved_freelancers_tab'),
    projects: t('saved_projects_tab'),
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['services', 'freelancers', 'projects'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium',
              tab === key ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--kwork-text-muted)]'
            )}
          >
            {tabLabel[key]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      ) : !hasItems ? (
        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)]">
          <EmptyState icon={<Bookmark />} title={t('no_saved_yet')} />
        </div>
      ) : tab === 'services' ? (
        <div className="catalog-grid">
          {services.map((svc) => (
            <ServiceCard
              key={svc.id}
              title={svc.title}
              sellerName={svc.profiles?.full_name ?? t('freelancer')}
              sellerInitials={initialsFromName(svc.profiles?.full_name ?? 'F')}
              rating={svc.profiles?.avg_rating ?? 0}
              reviewCount={svc.profiles?.review_count ?? 0}
              price={svc.price}
              category={svc.category}
              thumbnailUrl={svc.image_urls?.[0]}
              isSaved
              onClick={() => router.push(servicePath(svc.id))}
            />
          ))}
        </div>
      ) : tab === 'freelancers' ? (
        <div className="space-y-2">
          {freelancers.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => router.push(freelancerPath(f.id))}
              className="dashboard-order-card flex w-full items-center gap-3 text-left transition hover:border-[var(--color-primary)]"
            >
              <span className="font-semibold text-[var(--kwork-text)]">{f.full_name}</span>
              <span className="text-[13px] text-[var(--kwork-text-muted)]">{f.specialty}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <article key={p.id} className="dashboard-order-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--kwork-text)]">{p.title}</h2>
                  <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{p.region}</p>
                </div>
                <p className="text-[15px] font-bold text-[var(--color-primary)]">{formatPrice(p.budget)}</p>
              </div>
              <Link href={projectPath(p.id)} className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  {t('project_view_detail')}
                </Button>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
