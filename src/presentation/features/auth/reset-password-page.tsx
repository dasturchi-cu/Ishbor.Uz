'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { updatePassword } from '@/infrastructure/auth/password'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { PATHS } from '@/domain/constants/routes'
import { clearAuthCache } from '@/infrastructure/auth/session-cache'
import { toast } from '@/presentation/components/ui/toast'
import { AuthBrandPanel } from '@/presentation/components/auth/auth-brand-panel'
import { AuthPageFallback } from '@/presentation/components/auth/auth-page-fallback'

function ResetPasswordContent() {
  const { t } = useApp()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError(t('auth_supabase_not_configured'))
      return
    }

    const supabase = getSupabase()

    const init = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
        if (codeError) {
          setError(mapAuthErrorMessage(codeError.message, t))
          return
        }
      } else if (tokenHash && type === 'recovery') {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (otpError) {
          setError(mapAuthErrorMessage(otpError.message, t))
          return
        }
      } else if (hash.includes('type=recovery') || hash.includes('access_token')) {
        await supabase.auth.getSession()
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (!userError && userData.user) {
        setReady(true)
        return
      }
      setError(t('reset_password_link_invalid'))
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
        setError('')
      }
    })

    init()

    return () => listener.subscription.unsubscribe()
  }, [t])

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError(t('error_password_short'))
      return
    }
    if (password !== confirm) {
      setError(t('error_password_mismatch'))
      return
    }

    setLoading(true)
    setError('')
    try {
      await updatePassword(password)
      clearAuthCache()
      const supabase = getSupabase()
      await supabase.auth.signOut()
      toast.success(t('password_updated_success'))
      router.replace(PATHS.login)
    } catch (e) {
      setError(e instanceof Error ? mapAuthErrorMessage(e.message, t) : t('error_required'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <div className="auth-page-panel">
        <div className="auth-page-inner">
          <div className="auth-page-brand">
            <Link href={PATHS.home} className="auth-page-brand__logo">
              <span className="auth-page-brand__mark" aria-hidden />
              ISH<span>BOR</span>
            </Link>
          </div>

          <div className="auth-form-card">
            <header className="auth-form-header">
              <h1>{t('reset_password_title')}</h1>
              <p>{t('reset_password_subtitle')}</p>
            </header>

            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {ready ? (
              <form
                className="auth-form-fields"
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSubmit()
                }}
              >
                <Input
                  label={t('new_password')}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder={t('password_placeholder')}
                />
                <Input
                  label={t('confirm_password')}
                  type="password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    setError('')
                  }}
                  placeholder={t('password_placeholder')}
                />
                <p className="text-[12px] leading-relaxed text-[var(--kwork-text-muted)]">
                  {t('reset_password_relogin_note')}
                </p>
                <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                  {t('update_password')}
                </Button>
              </form>
            ) : (
              !error && (
                <p className="text-sm text-[var(--kwork-text-muted)]" role="status">
                  {t('auth_callback_loading')}
                </p>
              )
            )}

            <p className="auth-footer-link">
              <Link href={PATHS.login}>{t('login')} →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
