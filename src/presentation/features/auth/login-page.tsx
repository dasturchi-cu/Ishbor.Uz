'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { PATHS } from '@/domain/constants/routes'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { clearAuthCache } from '@/infrastructure/auth/session-cache'
import { toast } from '@/presentation/components/ui/toast'
import { resolvePostAuthDestination } from '@/shared/lib/auth-redirect'
import { signInWithGoogle } from '@/infrastructure/auth/oauth'
import { isGoogleAuthEnabled } from '@/infrastructure/auth/google-auth'
import { requestPasswordReset } from '@/infrastructure/auth/password'
import { AuthBrandPanel, AuthMobileTrust } from '@/presentation/components/auth/auth-brand-panel'
import { AuthPageFallback } from '@/presentation/components/auth/auth-page-fallback'
import { loginSchema } from '@/domain/validators/auth'

function LoginPageContent() {
  const { t, refreshProfile, isLoggedIn, isAuthLoading, currentUserRole, profile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { hash, search } = window.location
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        router.replace(`/auth/reset-password${search}${hash}`)
        return
      }
    }
    if (isAuthLoading || !isLoggedIn) return
    if (!profile) return
    router.replace(resolvePostAuthDestination(searchParams, profile, currentUserRole))
  }, [isAuthLoading, isLoggedIn, currentUserRole, profile, router, searchParams])

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const nextFieldErrors: { email?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'email') nextFieldErrors.email = t('error_email')
        if (key === 'password') nextFieldErrors.password = t('error_password_required')
      }
      setFieldErrors(nextFieldErrors)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabase()
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(mapAuthErrorMessage(authError.message, t))
          return
        }
        clearAuthCache()
        await refreshProfile()
        const me = await api.getProfile().catch(() => null)
        const role = me?.role === 'client' ? 'client' : 'freelancer'
        const name = me?.full_name ?? profile?.full_name ?? email.split('@')[0]
        toast.success(`${t('login_title')}, ${name}!`)
        router.refresh()
        router.replace(resolvePostAuthDestination(searchParams, me, role))
      } else {
        setError(t('auth_supabase_not_configured'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const emailCheck = loginSchema.shape.email.safeParse(email.trim())
    if (!emailCheck.success) {
      setError(t('error_email'))
      return
    }
    if (!isSupabaseConfigured()) {
      setError(t('auth_supabase_not_configured'))
      return
    }
    setResetLoading(true)
    setError('')
    setResetMessage('')
    try {
      await requestPasswordReset(email.trim())
      setResetMessage(t('password_reset_sent'))
    } catch (err) {
      setError(err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('error_required'))
    } finally {
      setResetLoading(false)
    }
  }

  const googleEnabled = isGoogleAuthEnabled()

  const handleGoogleLogin = async () => {
    if (!googleEnabled) {
      setError(t('google_auth_not_enabled'))
      return
    }
    if (!isSupabaseConfigured()) {
      setError(t('auth_supabase_not_configured'))
      return
    }
    setGoogleLoading(true)
    setError('')
    try {
      const returnTo = searchParams.get('returnTo')
      await signInWithGoogle(returnTo && returnTo.startsWith('/') ? returnTo : undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_required'))
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <a href="#login-form" className="skip-link">
        {t('skip_to_content')}
      </a>
      <div className="auth-page-panel">
        <div className="auth-page-panel__grid" aria-hidden />

        <div className="auth-page-inner">
          <Link href={PATHS.home} className="auth-back-link show-mobile">
            <ArrowLeft className="h-4 w-4" />
            {t('nav_home')}
          </Link>

          <div className="auth-page-brand">
            <Link href={PATHS.home} className="auth-page-brand__logo">
              <span className="auth-page-brand__mark" aria-hidden />
              ISH<span>BOR</span>
            </Link>
          </div>

          <div className="auth-form-card">
            <AuthMobileTrust />
            <header className="auth-form-header">
              <h1>{t('login_title')}</h1>
              <p>{t('login_subtitle')}</p>
            </header>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {resetMessage && (
            <Alert variant="success" className="mb-4">
              {resetMessage}
            </Alert>
          )}

          <form id="login-form" className="auth-form-fields" onSubmit={handleLogin} noValidate>
            <Input
              label={t('email')}
              type="email"
              autoComplete="email"
              inputSize="lg"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setFieldErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder={t('email_placeholder')}
              leftIcon={<Mail className="h-4 w-4" />}
              error={fieldErrors.email}
            />

            <div className="space-y-2">
              <Input
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                inputSize="lg"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                  setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={fieldErrors.password}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('hide_password') : t('show_password')}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--kwork-text-muted)] transition hover:bg-[var(--color-bg-subtle)] hover:text-[var(--kwork-text)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={handleForgotPassword}
                  className="text-[14px] font-medium text-[var(--color-primary)] transition hover:underline disabled:opacity-50"
                >
                  {resetLoading ? t('auth_callback_loading') : t('forgot_password')}
                </button>
              </div>
            </div>

            <Button variant="primary" fullWidth size="lg" loading={loading} type="submit" className="!min-h-[48px]">
              {t('sign_in')}
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="auth-divider mt-5" aria-hidden>
                {t('or')}
              </div>
              <button
                type="button"
                className="auth-google-btn mt-4"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
              >
                {googleLoading ? (
                  <span>{t('auth_callback_loading')}</span>
                ) : (
                  <>
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t('google_sign_in')}
                  </>
                )}
              </button>
            </>
          )}

          <p className="auth-footer-link">
            {t('no_account')}{' '}
            <Link href={PATHS.register}>{t('sign_up')} →</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
