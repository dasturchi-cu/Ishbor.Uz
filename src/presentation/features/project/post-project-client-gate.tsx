'use client'

import '@/presentation/styles/route-catalog.css'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { toast } from '@/presentation/components/ui/toast'

export function PostProjectClientGate() {
  const { t, currentUserRole, setCurrentUserRole } = useApp()
  const router = useRouter()

  const switchToClient = async () => {
    if (currentUserRole === 'client') {
      router.refresh()
      return
    }
    try {
      await setCurrentUserRole('client')
      toast.success(t('role_switched_client'))
      router.refresh()
    } catch {
      toast.error(t('onboarding_save_error'))
    }
  }

  return (
    <div className="min-h-[calc(100dvh-var(--ishbor-header-h))] bg-[var(--body-bg)] px-4 py-10">
      <div className="layout-container mx-auto max-w-[640px] space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <Users className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-[length:var(--text-h2)] font-bold text-[var(--ishbor-text)]">
          {t('post_project_client_gate_title')}
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--ishbor-text-muted)]">
          {t('post_project_client_gate_desc')}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={() => void switchToClient()}>
            {t('switch_to_client_mode')}
          </Button>
          <Button variant="outline" onClick={() => router.push(PATHS.projects)}>
            {t('projects_hero_browse')}
          </Button>
        </div>
        <IshborProtectionStrip compact />
      </div>
    </div>
  )
}
