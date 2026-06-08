'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { getSupabase } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { PATHS } from '@/domain/constants/routes'
import { resolvePostAuthDestination } from '@/shared/lib/auth-redirect'
import { consumeReferralRef } from '@/shared/lib/referral'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshProfile, t } = useApp()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      try {
        const supabase = getSupabase()
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !data.session) {
          if (!cancelled) {
            setError(t('auth_callback_failed'))
            router.replace(PATHS.login)
          }
          return
        }

        await refreshProfile()
        const me = await api.getProfile().catch(() => null)
        const ref = consumeReferralRef()
        if (ref && me?.id && ref !== me.id) {
          await api.applyReferral(ref).catch(() => {})
        }

        const user = data.session.user
        const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0
        const isNewOAuth = createdMs > 0 && Date.now() - createdMs < 10 * 60 * 1000
        const needsRole = isNewOAuth && !me?.onboarding_completed

        if (needsRole) {
          const qs = searchParams.toString()
          if (!cancelled) router.replace(qs ? `${PATHS.authRole}?${qs}` : PATHS.authRole)
          return
        }

        const role = me?.role === 'client' ? 'client' : 'freelancer'
        const dest = resolvePostAuthDestination(searchParams, me, role)

        if (!cancelled) router.replace(dest)
      } catch {
        if (!cancelled) {
          setError(t('auth_callback_failed'))
          router.replace(PATHS.login)
        }
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [router, searchParams, refreshProfile, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <p className="text-sm text-[var(--kwork-text-muted)]">
        {error || t('auth_callback_loading')}
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
          <p className="text-sm text-[var(--kwork-text-muted)]">Kirish...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
