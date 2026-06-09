'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'
import type { ApiProject } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { clientOnboardingProgress } from '@/shared/lib/onboarding-progress'
import {
  recordOnboardingChecklistSession,
  shouldShowOnboardingChecklist,
} from '@/shared/lib/onboarding-session-limit'

interface Step {
  id: string
  label: string
  done: boolean
  href: string
}

interface ClientOnboardingChecklistProps {
  projects: ApiProject[]
  hasOrders: boolean
  className?: string
}

export function ClientOnboardingChecklist({
  projects,
  hasOrders,
  className,
}: ClientOnboardingChecklistProps) {
  const { t, profile } = useApp()
  const [sessionVisible, setSessionVisible] = useState(true)
  const completion = profileCompletionPercent(profile, 'client')
  const progress = clientOnboardingProgress(profile, projects, hasOrders)

  useEffect(() => {
    setSessionVisible(shouldShowOnboardingChecklist())
    recordOnboardingChecklistSession()
  }, [])

  const steps = useMemo<Step[]>(
    () => [
      {
        id: 'profile',
        label: t('onboarding_step_profile'),
        done: completion >= 100,
        href: PATHS.dashboardProfile,
      },
      {
        id: 'project',
        label: t('onboarding_step_first_project'),
        done: projects.length >= 1,
        href: PATHS.postProject,
      },
      {
        id: 'order',
        label: t('onboarding_step_first_order'),
        done: hasOrders,
        href: PATHS.services,
      },
    ],
    [completion, hasOrders, projects.length, t]
  )

  if (progress.complete || !sessionVisible) return null

  return (
    <section
      className={cn(
        'rounded-[var(--r-lg)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4 shadow-[var(--shadow-xs)] sm:p-5',
        className
      )}
      aria-label={t('onboarding_first_steps')}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--ishbor-text)]">{t('onboarding_first_steps')}</h2>
        <span className="text-[12px] font-medium text-[var(--ishbor-text-muted)]">
          {progress.done}/{progress.total}
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--r-md)] border px-3 py-2.5 text-[13px] transition',
                step.done
                  ? 'border-[var(--success)]/30 bg-[var(--success-bg)] text-[var(--ishbor-text-muted)]'
                  : 'border-[var(--ishbor-border)] bg-[var(--neutral-50)] text-[var(--ishbor-text)] hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--ishbor-border))] hover:bg-[var(--neutral-0)]'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-[var(--success)] text-white'
                    : 'border border-[var(--ishbor-border)] bg-[var(--neutral-0)] text-[var(--ishbor-text-muted)]'
                )}
                aria-hidden
              >
                {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
              </span>
              <span className={cn('min-w-0 flex-1 font-medium', step.done && 'line-through')}>
                {step.id === 'profile'
                  ? `${step.label} (${t('profile_completion').replace('{n}', String(completion))})`
                  : step.label}
              </span>
              {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ishbor-text-muted)]" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
