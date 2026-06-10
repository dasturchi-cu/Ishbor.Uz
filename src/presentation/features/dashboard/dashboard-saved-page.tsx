'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { FreelancerCard } from '@/presentation/components/features/freelancer-card'
import { Button } from '@/presentation/components/ui/button'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { SkeletonCard } from '@/presentation/components/ui/skeleton'
import { api } from '@/infrastructure/api/client'
import type { ApiProject } from '@/infrastructure/api/types'
import { toggleSavedFreelancer } from '@/shared/lib/saved-items'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { PATHS, servicePath, freelancerPath, projectPath } from '@/domain/constants/routes'
import { initialsFromName } from '@/shared/lib/avatar'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'

type SavedTab = 'services' | 'freelancers' | 'projects'

export function DashboardSavedPage() {
  const { t } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<SavedTab>('services')
  const fetchSaved = useCallback(async () => {
    const [svcResult, frResult, prResult] = await Promise.allSettled([
      api.listSavedServicesEnriched(),
      api.listSavedFreelancersEnriched(),
      api.listSavedProjects().then((rows) =>
        rows.map((r) => r.projects).filter(Boolean) as ApiProject[]
      ),
    ])
    const failures = [svcResult, frResult, prResult].filter((r) => r.status === 'rejected')
    if (failures.length === 3) {
      throw failures[0].reason
    }
    return {
      services: svcResult.status === 'fulfilled' ? svcResult.value : [],
      freelancers:
        frResult.status === 'fulfilled'
          ? (frResult.value as Awaited<ReturnType<typeof api.listFreelancers>>)
          : [],
      projects: prResult.status === 'fulfilled' ? prResult.value : [],
    }
  }, [])

  const {
    data: savedData,
    loading,
    error: savedLoadError,
    loadError: savedFetchError,
    reload: loadSaved,
  } = useProtectedLoader(fetchSaved, [])
  const services = savedData?.services ?? []
  const freelancers = savedData?.freelancers ?? []
  const projects = savedData?.projects ?? []

  const counts: Record<SavedTab, number> = {
    services: services.length,
    freelancers: freelancers.length,
    projects: projects.length,
  }

  const hasItems = counts[tab] > 0

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
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium',
              tab === key
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                : 'text-[var(--ishbor-text-muted)]'
            )}
          >
            {tabLabel[key]}
            {!loading && counts[key] > 0 && (
              <span className="rounded-full bg-[var(--neutral-0)] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {savedLoadError && (
        <LoadErrorAlert
          error={savedFetchError}
          scope="saved"
          onRetry={loadSaved}
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="catalog-grid">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !hasItems && !savedFetchError ? (
        <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)]">
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
                trustScore={f.trust_score}
                variant="grid"
                onClick={() => router.push(freelancerPath(f))}
              />
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-[var(--neutral-0)] px-2 py-1 text-[11px] font-medium text-[var(--color-primary)] shadow-sm"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    await toggleSavedFreelancer(f.id)
                    toast.success(t('unsave'))
                    void loadSaved()
                  } catch (err) {
                    toast.error(captureActionError(err, { scope: 'generic', action: 'save_item' }, t))
                  }
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
                  <h2 className="text-[15px] font-bold text-[var(--ishbor-text)]">{p.title}</h2>
                  <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">{p.region}</p>
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
