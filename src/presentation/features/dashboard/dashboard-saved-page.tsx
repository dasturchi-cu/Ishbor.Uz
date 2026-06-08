'use client'



import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { Bookmark } from 'lucide-react'

import { useApp } from '@/application/providers/app-provider'

import { EmptyState } from '@/presentation/components/ui/empty-state'

import { ServiceCard } from '@/presentation/components/features/service-card'

import { FreelancerCard } from '@/presentation/components/features/freelancer-card'

import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'

import { api } from '@/infrastructure/api/client'

import type { ApiProject, ApiService } from '@/infrastructure/api/types'

import { toggleSavedFreelancer } from '@/shared/lib/saved-items'

import { PATHS, servicePath, freelancerPath, projectPath } from '@/domain/constants/routes'

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
  const [loadError, setLoadError] = useState(false)



  const loadSaved = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([
      api.listSavedServicesEnriched(),
      api.listSavedFreelancersEnriched(),
      api.listSavedProjects().then((rows) =>
        rows.map((r) => r.projects).filter(Boolean) as ApiProject[]
      ),
    ])
      .then(([svc, fr, pr]) => {
        setServices(svc)
        setFreelancers(fr as Awaited<ReturnType<typeof api.listFreelancers>>)
        setProjects(pr)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSaved()
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

      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={loadSaved}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (

        <div className="h-40 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />

      ) : !hasItems && !loadError ? (

        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)]">

          <EmptyState
            icon={<Bookmark />}
            title={t('no_saved_yet')}
            description={
              tab === 'services'
                ? t('saved_empty_services_desc')
                : tab === 'freelancers'
                  ? t('saved_empty_freelancers_desc')
                  : t('saved_empty_projects_desc')
            }
            action={{
              label:
                tab === 'services'
                  ? t('browse_services')
                  : tab === 'freelancers'
                    ? t('nav_freelancers')
                    : t('nav_projects'),
              onClick: () =>
                router.push(
                  tab === 'services'
                    ? PATHS.services
                    : tab === 'freelancers'
                      ? PATHS.freelancers
                      : PATHS.projects
                ),
            }}
          />

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

              isPro={svc.profiles?.is_verified}

              isSaved

              onClick={() => router.push(servicePath(svc.id))}

            />

          ))}

        </div>

      ) : tab === 'freelancers' ? (

        <div className="grid gap-3 sm:grid-cols-2">

          {freelancers.map((f) => (

            <div key={f.id} className="relative">

              <FreelancerCard

                name={f.full_name ?? t('freelancer')}

                specialty={f.specialty}

                region={f.region}

                rating={f.avg_rating ?? 0}

                reviewCount={f.review_count ?? 0}

                isVerified={f.is_verified}

                variant="grid"

                onClick={() => router.push(freelancerPath(f.id))}

              />

              <button

                type="button"

                className="absolute right-3 top-3 rounded-full bg-[var(--neutral-0)] px-2 py-1 text-[11px] font-medium text-[var(--color-primary)] shadow-sm"

                onClick={async (e) => {

                  e.stopPropagation()

                  await toggleSavedFreelancer(f.id)

                  setFreelancers((prev) => prev.filter((x) => x.id !== f.id))

                }}

              >

                {t('unsave')}

              </button>

            </div>

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


