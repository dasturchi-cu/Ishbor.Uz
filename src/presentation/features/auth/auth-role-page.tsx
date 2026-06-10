'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Briefcase, Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import { PATHS } from '@/domain/constants/routes'
import { resolvePostAuthDestination } from '@/shared/lib/auth-redirect'
import { AuthBrandPanel, AuthMobileTrust } from '@/presentation/components/auth/auth-brand-panel'
import { AuthRoleCard } from '@/presentation/components/auth/auth-role-card'
import { toast } from '@/presentation/components/ui/toast'
import { ApiError } from '@/infrastructure/api/client'

export function AuthRolePage() {
  const { t, setCurrentUserRole, mergeProfile } = useApp()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'freelancer' | 'client' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!role || loading) return
    setLoading(true)
    try {
      const updated = await api.updateProfileRole(role)
      setCurrentUserRole(role)
      mergeProfile({ ...updated, role })
      const dest = resolvePostAuthDestination(searchParams, updated, role)
      const qs = searchParams.toString()
      const url = qs ? `${dest}?${qs}` : dest
      window.location.assign(url)
    } catch (e) {
      const message = e instanceof ApiError ? e.message : t('onboarding_save_error')
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <a href="#auth-role-form" className="skip-link">
        {t('skip_to_content')}
      </a>
      <div className="auth-page-panel">
        <div className="auth-page-inner max-w-[560px]">
          <Link href={PATHS.home} className="auth-back-link">
            <ArrowLeft className="h-4 w-4" />
            {t('nav_home')}
          </Link>
          <div className="auth-page-brand">
            <Link href={PATHS.home} className="auth-page-brand__logo">
              <span className="auth-page-brand__mark" aria-hidden />
              ISH<span>BOR</span>
            </Link>
          </div>
          <div id="auth-role-form" className="auth-form-card">
            <AuthMobileTrust />
            <header className="auth-form-header auth-form-header--role">
              <h1>{t('register_role_title')}</h1>
              <p>{t('register_role_subtitle')}</p>
            </header>
            <div className="auth-form-fields">
              <div className="auth-role-grid">
                <AuthRoleCard
                  selected={role === 'freelancer'}
                  icon={<Briefcase className="h-6 w-6 text-[var(--color-primary)]" />}
                  title={t('register_seeker_title')}
                  subtitle={t('freelancer_desc')}
                  bullets={[
                    t('register_freelancer_bullet_1'),
                    t('register_freelancer_bullet_2'),
                    t('register_freelancer_bullet_3'),
                  ]}
                  onSelect={() => setRole('freelancer')}
                />
                <AuthRoleCard
                  selected={role === 'client'}
                  icon={<Users className="h-6 w-6 text-[var(--color-primary)]" />}
                  iconBg="color-mix(in srgb, var(--color-primary) 10%, var(--neutral-0))"
                  title={t('register_employer_title')}
                  subtitle={t('client_desc')}
                  bullets={[
                    t('register_client_bullet_1'),
                    t('register_client_bullet_2'),
                    t('register_client_bullet_3'),
                  ]}
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
    </div>
  )
}
