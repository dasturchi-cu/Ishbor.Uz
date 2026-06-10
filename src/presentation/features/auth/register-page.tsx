'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { AuthPageBrand } from '@/presentation/components/layout/brand-logo'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Select } from '@/presentation/components/ui/select'
import { ArrowLeft, Briefcase, Users } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { persistProfilePatch } from '@/shared/lib/persist-profile-patch'
import { PATHS, dashboardPathForRole } from '@/domain/constants/routes'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { signInWithGoogle } from '@/infrastructure/auth/oauth'
import { isGoogleAuthEnabled } from '@/infrastructure/auth/google-auth'
import { storeReferralRef, consumeReferralRef } from '@/shared/lib/referral'
import { registerStep2Schema } from '@/domain/validators/auth'
import { AuthBrandPanel, AuthMobileTrust } from '@/presentation/components/auth/auth-brand-panel'
import { AuthRoleCard } from '@/presentation/components/auth/auth-role-card'
import { AuthPageFallback } from '@/presentation/components/auth/auth-page-fallback'
import { pickAvailableUsername } from '@/shared/lib/username'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/presentation/components/ui/toast'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

function RegisterPageContent() {
  const { t, setCurrentUserRole, refreshProfile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<'freelancer' | 'client' | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+998',
    password: '',
    confirmPassword: '',
    specialty: '',
    company: '',
    city: '',
    bio: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    storeReferralRef(searchParams.get('ref'))
  }, [searchParams])

  const regionOptions = UZ_REGIONS.map((r) => ({ value: r, label: r }))

  const handleRoleSelect = (selectedRole: 'freelancer' | 'client') => {
    setRole(selectedRole)
  }

  const handleRoleContinue = () => {
    if (!role) return
    setCurrentUserRole(role)
    setStep(2)
  }

  function passwordStrengthLevel(pw: string): 0 | 1 | 2 | 3 {
    if (!pw || pw.length < 8) return 0
    let score = 1
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score = 2
    if (pw.length >= 12 && /[^A-Za-z0-9]/.test(pw)) score = 3
    return score as 0 | 1 | 2 | 3
  }

  const strengthLevel = passwordStrengthLevel(formData.password)
  const strengthLabel =
    strengthLevel === 0
      ? t('password_strength_short')
      : strengthLevel === 1
        ? t('password_strength_weak')
        : strengthLevel === 2
          ? t('password_strength_medium')
          : t('password_strength_strong')

  const validateStep2 = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '')
    const parsed = registerStep2Schema.safeParse({
      fullName: formData.fullName,
      email: formData.email,
      phone: phoneDigits.length > 3 ? `+${phoneDigits}` : formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      agreeTerms: formData.agreeTerms,
    })
    if (parsed.success) {
      setErrors({})
      return true
    }
    const newErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key !== 'string' || newErrors[key]) continue
      if (key === 'email') newErrors.email = t('error_email')
      else if (key === 'phone') newErrors.phone = t('error_phone_invalid')
      else if (key === 'password') newErrors.password = t('error_password_short')
      else if (key === 'confirmPassword') newErrors.confirmPassword = t('error_password_mismatch')
      else if (key === 'agreeTerms') newErrors.agreeTerms = t('error_agree_terms')
      else newErrors[key] = t('error_required')
    }
    setErrors(newErrors)
    return false
  }

  const handleRegisterSubmit = async () => {
    setSuccessMessage(null)
    if (!validateStep2()) return
    if (!formData.city.trim()) {
      setErrors({ city: t('error_required') })
      return
    }
    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: t('error_agree_terms') })
      return
    }
    if (!isSupabaseConfigured()) {
      setErrors({ submit: t('auth_supabase_not_configured') })
      return
    }

    setLoading(true)
    setErrors({})
    const selectedRole = role || 'freelancer'

    try {
      const supabase = getSupabase()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: selectedRole,
            ...(formData.city.trim() ? { region: formData.city.trim() } : {}),
            ...(selectedRole === 'client' && formData.company.trim()
              ? { company: formData.company.trim() }
              : {}),
          },
        },
      })

      if (signUpError) {
        setErrors({ submit: mapAuthErrorMessage(signUpError.message, t) })
        return
      }

      if (data.session) {
        setCurrentUserRole(selectedRole)
        let destination: string = PATHS.onboarding
        try {
          const username = await pickAvailableUsername(formData.email, formData.fullName)
          const userId = data.session.user.id
          const updated = await persistProfilePatch(userId, {
            full_name: formData.fullName,
            phone: formData.phone,
            region: formData.city,
            username,
            specialty: selectedRole === 'client' ? formData.company.trim() || undefined : formData.specialty,
            bio:
              selectedRole === 'client'
                ? formData.company.trim() || formData.bio
                : formData.bio,
          })
          if (updated.role !== selectedRole) {
            await api.updateProfileRole(selectedRole)
          }
          await refreshProfile()
          if (updated.onboarding_completed) {
            destination = dashboardPathForRole(selectedRole)
          }
        } catch (profileErr) {
          destination = PATHS.onboarding
          toast.error(
            profileErr instanceof Error
              ? mapAuthErrorMessage(profileErr.message, t)
              : t('error_profile_sync_failed')
          )
          await refreshProfile().catch((e) =>
            ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me' })
          )
        }
        const ref = consumeReferralRef() ?? searchParams.get('ref')
        if (ref) {
          await api.applyReferral(ref).catch((e) =>
            ignoreWithLog(e, { scope: 'generic', apiPath: '/api/v1/profiles/me/referral' })
          )
        }
        if (formData.city.trim()) {
          sessionStorage.setItem('ishbor-register-region', formData.city.trim())
        }
        api
          .auditRegister()
          .catch((e) => ignoreWithLog(e, { scope: 'auth', apiPath: '/api/v1/platform/audit/register' }))
        Promise.all([
          api
            .getCurrentTerms('terms')
            .then((doc) => api.acceptTermsConsent('terms', doc.version))
            .catch((e) => ignoreWithLog(e, { scope: 'generic', apiPath: '/api/v1/trust/terms/consent' })),
          api
            .getCurrentTerms('privacy')
            .then((doc) => api.acceptTermsConsent('privacy', doc.version))
            .catch((e) => ignoreWithLog(e, { scope: 'generic', apiPath: '/api/v1/trust/terms/consent' })),
        ])
        router.push(destination)
      } else {
        setSuccessMessage(t('auth_email_confirm_sent'))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t('register_failed')
      setErrors({ submit: mapAuthErrorMessage(message, t) })
    } finally {
      setLoading(false)
    }
  }

  const googleEnabled = isGoogleAuthEnabled()

  const handleGoogleRegister = async () => {
    if (!googleEnabled) {
      setErrors({ submit: t('google_auth_not_enabled') })
      return
    }
    if (!isSupabaseConfigured()) {
      setErrors({ submit: t('auth_supabase_not_configured') })
      return
    }
    setGoogleLoading(true)
    try {
      storeReferralRef(searchParams.get('ref'))
      await signInWithGoogle(PATHS.onboarding)
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : t('error_required') })
      setGoogleLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="auth-layout">
        <AuthBrandPanel />
        <a href="#register-form" className="skip-link">
          {t('skip_to_content')}
        </a>
        <div className="auth-page-panel">
          <div className="auth-page-inner form-shell max-w-lg">
            <Link href={PATHS.home} className="auth-back-link show-mobile">
              <ArrowLeft className="h-4 w-4" />
              {t('nav_home')}
            </Link>
            <AuthPageBrand href={PATHS.home} />

            <div id="register-form" className="auth-form-card">
              <AuthMobileTrust />
              <header className="auth-form-header">
                <span className="auth-step-badge">
                  {t('register_step_label').replace('{n}', '1').replace('{total}', '2')}
                </span>
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
              bullets={[t('register_freelancer_bullet_1'), t('register_freelancer_bullet_2'), t('register_freelancer_bullet_3')]}
              onSelect={() => handleRoleSelect('freelancer')}
            />
            <AuthRoleCard
              selected={role === 'client'}
              icon={<Users className="h-6 w-6 text-[var(--color-primary)]" />}
              iconBg="color-mix(in srgb, var(--color-primary) 10%, var(--neutral-0))"
              title={t('register_employer_title')}
              subtitle={t('client_desc')}
              bullets={[t('register_client_bullet_1'), t('register_client_bullet_2'), t('register_client_bullet_3')]}
              onSelect={() => handleRoleSelect('client')}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!role}
            onClick={handleRoleContinue}
          >
            {t('continue')} →
          </Button>
          {!role && (
            <p className="text-center text-[12px] text-[var(--ishbor-text-muted)]">{t('select_role_first')}</p>
          )}

          {googleEnabled && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="gap-2"
              loading={googleLoading}
              onClick={handleGoogleRegister}
            >
              {t('google_sign_up')}
            </Button>
          )}

          <p className="auth-footer-link">
            {t('already_have_account')}{' '}
            <Link href={PATHS.login}>{t('login')} →</Link>
          </p>
          </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <AuthBrandPanel />
      <a href="#register-form" className="skip-link">
        {t('skip_to_content')}
      </a>

      <div className="auth-page-panel">
        <div className="auth-page-inner form-shell">
          <Link href={PATHS.home} className="auth-back-link show-mobile">
            <ArrowLeft className="h-4 w-4" />
            {t('nav_home')}
          </Link>
          <AuthPageBrand href={PATHS.home} />

          <div id="register-form" className="auth-form-card">
            <AuthMobileTrust />
            <header className="auth-form-header">
              <span className="auth-step-badge">
                {t('register_step_label').replace('{n}', String(step)).replace('{total}', '2')}
              </span>
              <h1>{t('your_info')}</h1>
              <p>{t('account_info_desc')}</p>
            </header>

          <div className="auth-form-fields">

          {step === 2 && role && (
            <>
              <Input
                label={t('full_name')}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                error={errors.fullName}
              />
              <Input
                label={t('email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
              <Input
                label={t('phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
              />
              <Input
                label={t('password')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('password_placeholder')}
                error={errors.password}
                passwordToggleShowLabel={t('show_password')}
                passwordToggleHideLabel={t('hide_password')}
              />
              {formData.password.length > 0 && (
                <div className="password-strength" aria-live="polite">
                  <div className="password-strength-segments">
                    {[1, 2, 3].map((seg) => (
                      <span
                        key={seg}
                        className={cn(
                          'password-strength-segment',
                          strengthLevel === 0 && seg === 1 && 'password-strength-segment--short',
                          strengthLevel >= seg &&
                            strengthLevel > 0 &&
                            `password-strength-segment--${strengthLevel}`
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      'password-strength-label',
                      strengthLevel === 0 && 'password-strength-label--short',
                      strengthLevel === 1 && 'password-strength-label--1',
                      strengthLevel === 2 && 'password-strength-label--2',
                      strengthLevel === 3 && 'password-strength-label--3'
                    )}
                  >
                    {strengthLabel}
                  </span>
                </div>
              )}
              <Input
                label={t('confirm_password')}
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder={t('password_placeholder')}
                error={errors.confirmPassword}
                passwordToggleShowLabel={t('show_password')}
                passwordToggleHideLabel={t('hide_password')}
              />
              <label className="flex items-start gap-2 text-[13px] text-[var(--color-text-sub)]">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <span>
                  {t('agree_terms_prefix')}{' '}
                  <Link href={PATHS.terms} className="font-medium text-[var(--color-primary)] hover:underline" target="_blank">
                    {t('agree_terms_link')}
                  </Link>
                  {t('agree_terms_suffix') ? ` ${t('agree_terms_suffix')}` : ''}
                </span>
              </label>
              {errors.agreeTerms && (
                <Alert variant="error" className="py-2 text-[12px]">
                  {errors.agreeTerms}
                </Alert>
              )}
              {role === 'client' && (
                <Input
                  label={t('company_optional')}
                  placeholder={t('company_name')}
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              )}
              <Select
                label={t('region')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('select')}
                options={regionOptions}
                error={errors.city}
                inputSize="lg"
              />
              {successMessage && (
                <Alert variant="success">
                  <p>{successMessage}</p>
                  <Link href={PATHS.login} className="font-semibold underline">
                    {t('login')}
                  </Link>
                </Alert>
              )}
              {errors.submit && <Alert variant="error">{errors.submit}</Alert>}
              {!successMessage && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button
                    variant="primary"
                    loading={loading}
                    onClick={() => void handleRegisterSubmit()}
                    className="flex-1"
                  >
                    {t('sign_up')}
                  </Button>
                </div>
              )}
            </>
          )}

          <p className="auth-footer-link">
            {t('already_have_account')}{' '}
            <Link href={PATHS.login}>{t('login')} →</Link>
          </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  )
}
