'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import { PATHS } from '@/domain/constants/routes'
import { resolvePostAuthDestination } from '@/shared/lib/auth-redirect'
import { AuthBrandPanel } from '@/presentation/components/auth/auth-brand-panel'
import { toast } from '@/presentation/components/ui/toast'

function RoleCard({
  selected,
  title,
  subtitle,
  onSelect,
  icon,
}: {
  selected: boolean
  title: string
  subtitle: string
  onSelect: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`auth-role-card w-full text-left ${selected ? 'auth-role-card--selected' : ''}`}
    >
      <div className="mb-3">{icon}</div>
      <p className="font-bold text-[var(--kwork-text)]">{title}</p>
      <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">{subtitle}</p>
    </button>
  )
}

export function AuthRolePage() {
  const { t, refreshProfile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'freelancer' | 'client' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!role) return
    setLoading(true)
    try {
      await api.updateProfile({ role })
      await refreshProfile()
      const me = await api.getProfile()
      const dest = resolvePostAuthDestination(searchParams, me, role)
      router.replace(dest)
    } catch {
      toast.error(t('onboarding_save_error'))
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <div className="auth-page-panel">
        <div className="auth-page-inner max-w-[560px]">
          <div className="auth-page-brand">
            <Link href={PATHS.home} className="auth-page-brand__logo">
              <span className="auth-page-brand__mark" aria-hidden />
              ISH<span>BOR</span>
            </Link>
          </div>
          <div className="auth-form-card">
            <header className="auth-form-header">
              <h1>{t('register_role_title')}</h1>
              <p>{t('register_role_subtitle')}</p>
            </header>
            <div className="auth-role-grid">
              <RoleCard
                selected={role === 'freelancer'}
                icon={<Briefcase className="h-8 w-8 text-[var(--color-primary)]" />}
                title={t('register_seeker_title')}
                subtitle={t('freelancer_desc')}
                onSelect={() => setRole('freelancer')}
              />
              <RoleCard
                selected={role === 'client'}
                icon={<Users className="h-8 w-8 text-[var(--success)]" />}
                title={t('register_employer_title')}
                subtitle={t('client_desc')}
                onSelect={() => setRole('client')}
              />
            </div>
            <Button variant="primary" size="lg" fullWidth disabled={!role} loading={loading} onClick={handleContinue}>
              {t('continue')} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
