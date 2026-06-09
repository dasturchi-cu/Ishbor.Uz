'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'
import type { ApiService } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { freelancerOnboardingProgress } from '@/shared/lib/onboarding-progress'

const BIRJA_SEEN_KEY = 'ishbor_onboarding_birja_seen'

interface Step {
  id: string
  label: string
  done: boolean
  href: string
}

interface FreelancerOnboardingChecklistProps {
  services: ApiService[]
  hasOrders: boolean
  className?: string
}

export function FreelancerOnboardingChecklist({
  services,
  hasOrders,
  className,
}: FreelancerOnboardingChecklistProps) {
  const { t, profile } = useApp()
  const [birjaSeen, setBirjaSeen] = useState(false)

  useEffect(() => {
    try {
      setBirjaSeen(localStorage.getItem(BIRJA_SEEN_KEY) === '1')
    } catch {
      setBirjaSeen(false)
    }
  }, [])

  const completion = profileCompletionPercent(profile, 'freelancer')

  const steps = useMemo<Step[]>(
    () => [
      {
        id: 'profile',
        label: t('onboarding_step_profile'),
        done: completion >= 100,
        href: PATHS.dashboardProfile,
      },
      {
        id: 'service',
        label: t('onboarding_step_first_service'),
        done: services.length >= 1,
        href: PATHS.dashboardServicesNew,
      },
      {
        id: 'portfolio',
        label: t('onboarding_step_portfolio'),
        done: services.some((s) => s.price > 0) && Boolean(profile?.bio?.trim()),
        href: PATHS.dashboardProfile,
      },
      {
        id: 'birja',
        label: t('onboarding_step_birja'),
        done: birjaSeen || hasOrders,
        href: PATHS.postProject,
      },
    ],
    [birjaSeen, completion, hasOrders, profile?.bio, services, t]
  )

  const progress = freelancerOnboardingProgress(profile, services, hasOrders, birjaSeen)
  if (progress.complete) return null

  const markBirjaSeen = () => {
    try {
      localStorage.setItem(BIRJA_SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setBirjaSeen(true)
  }

  return (
    <section
      className={cn(
        'rounded-[var(--r-lg)] border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4 shadow-[var(--shadow-xs)] sm:p-5',
        className
      )}
      aria-label={t('onboarding_first_steps')}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--kwork-text)]">{t('onboarding_first_steps')}</h2>
        <span className="text-[12px] font-medium text-[var(--kwork-text-muted)]">
          {progress.done}/{progress.total}
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              onClick={step.id === 'birja' ? markBirjaSeen : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[var(--r-md)] border px-3 py-2.5 text-[13px] transition',
                step.done
                  ? 'border-[var(--success)]/30 bg-[var(--success-bg)] text-[var(--kwork-text-muted)]'
                  : 'border-[var(--kwork-border)] bg-[var(--neutral-50)] text-[var(--kwork-text)] hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--kwork-border))] hover:bg-[var(--neutral-0)]'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-[var(--success)] text-white'
                    : 'border border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text-muted)]'
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
              {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--kwork-text-muted)]" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
