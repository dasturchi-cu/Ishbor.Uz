'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Check, Briefcase, Users } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { PATHS } from '@/domain/constants/routes'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { cn } from '@/shared/lib/utils'
import { signInWithGoogle } from '@/infrastructure/auth/oauth'
import { isGoogleAuthEnabled } from '@/infrastructure/auth/google-auth'
import { storeReferralRef, consumeReferralRef } from '@/shared/lib/referral'
import { registerStep2Schema } from '@/domain/validators/auth'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { AuthBrandPanel, AuthMobileTrust } from '@/presentation/components/auth/auth-brand-panel'
import { AuthPageFallback } from '@/presentation/components/auth/auth-page-fallback'

function RegisterPageContent() {
  const { t, setCurrentUserRole, refreshProfile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2 | 3>(1)
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

  const cities = UZ_REGIONS

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
      ? ''
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

  const handleNextStep = () => {
    setSuccessMessage(null)
    if (validateStep2()) setStep(3)
  }

  const validateStep3 = () => {
    const next: Record<string, string> = {}
    if (!formData.city.trim()) next.city = t('error_required')
    if (role === 'freelancer' && !formData.specialty.trim()) next.specialty = t('error_required')
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return false
    }
    setErrors({})
    return true
  }

  const handleRegister = async () => {
    setSuccessMessage(null)
    if (!validateStep3()) return
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
        options: { data: { full_name: formData.fullName, role: selectedRole } },
      })

      if (signUpError) {
        setErrors({ submit: mapAuthErrorMessage(signUpError.message, t) })
        return
      }

      if (data.session) {
        setCurrentUserRole(selectedRole)
        try {
          await api.updateProfile({
            full_name: formData.fullName,
            phone: formData.phone,
            region: formData.city,
            specialty: selectedRole === 'client' ? formData.company.trim() || undefined : formData.specialty,
            bio:
              selectedRole === 'client'
                ? formData.company.trim() || formData.bio
                : formData.bio,
          })
        } catch {
          // trigger profil yaratgan bo'lishi mumkin
        }
        await refreshProfile()
        const ref = consumeReferralRef() ?? searchParams.get('ref')
        if (ref) {
          await api.applyReferral(ref).catch(() => {})
        }
        router.push(PATHS.onboarding)
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
                <span className="auth-step-badge">
                  {t('register_step_label').replace('{n}', '1').replace('{total}', '3')}
                </span>
                <h1>{t('register_role_title')}</h1>
                <p>{t('register_role_subtitle')}</p>
              </header>

          <div className="auth-form-fields">
          <div className="auth-role-grid">
            <RoleCard
              selected={role === 'freelancer'}
              icon={<Briefcase className="h-8 w-8 text-[var(--color-primary)]" />}
              title={t('register_seeker_title')}
              subtitle={t('freelancer_desc')}
              bullets={[t('register_freelancer_bullet_1'), t('register_freelancer_bullet_2'), t('register_freelancer_bullet_3')]}
              onSelect={() => handleRoleSelect('freelancer')}
            />
            <RoleCard
              selected={role === 'client'}
              icon={<Users className="h-8 w-8 text-[var(--success)]" />}
              iconBg="var(--success-bg)"
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
            <p className="text-center text-[12px] text-[var(--kwork-text-muted)]">{t('select_role_first')}</p>
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
        <div className="auth-page-inner">
          <div className="auth-page-brand">
            <Link href={PATHS.home} className="auth-page-brand__logo">
              <span className="auth-page-brand__mark" aria-hidden />
              ISH<span>BOR</span>
            </Link>
          </div>

          <div id="register-form" className="auth-form-card">
            <AuthMobileTrust />
            <header className="auth-form-header">
              <span className="auth-step-badge">
                {t('register_step_label').replace('{n}', String(step)).replace('{total}', '3')}
              </span>
              <h1>{step === 2 ? t('your_info') : t('create_profile_title')}</h1>
              <p>{step === 2 ? t('account_info_desc') : t('initial_setup')}</p>
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
                error={errors.password}
              />
              {formData.password.length > 0 && (
                <div className="password-strength">
                  <div className="password-strength-track">
                    <span
                      className={cn(
                        'password-strength-bar',
                        strengthLevel >= 1 && 'password-strength-bar--1',
                        strengthLevel >= 2 && 'password-strength-bar--2',
                        strengthLevel >= 3 && 'password-strength-bar--3'
                      )}
                    />
                  </div>
                  {strengthLabel && (
                    <span className="password-strength-label">{strengthLabel}</span>
                  )}
                </div>
              )}
              <Input
                label={t('confirm_password')}
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
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
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {t('back')}
                </Button>
                <Button variant="primary" onClick={handleNextStep} className="flex-1">
                  {t('continue')} →
                </Button>
              </div>
            </>
          )}

          {step === 3 && role && (
            <>
              {successMessage && (
                <Alert variant="success">
                  <p>{successMessage}</p>
                  <Link href={PATHS.login} className="font-semibold underline">
                    {t('login')}
                  </Link>
                </Alert>
              )}

              {errors.submit && <Alert variant="error">{errors.submit}</Alert>}

              {role === 'freelancer' ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]">
                      {t('specialty')}
                    </label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="select-auth h-10 w-full rounded-[var(--r-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm"
                    >
                      <option value="">{t('select')}</option>
                      {KWORK_CATEGORY_ITEMS.map((item) => (
                        <option key={item.cat} value={item.cat}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]">
                      {t('region')}
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="select-auth h-10 w-full rounded-[var(--r-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm"
                    >
                      <option value="">{t('select')}</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <Textarea
                    label={t('bio')}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={t('describe_yourself')}
                  />
                </>
              ) : (
                <>
                  <Input
                    label={t('company_optional')}
                    placeholder={t('company_name')}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-sub)]">
                      {t('region')}
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="select-auth h-10 w-full rounded-[var(--r-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm"
                    >
                      <option value="">{t('select')}</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  {t('back')}
                </Button>
                <Button
                  variant="primary"
                  loading={loading}
                  disabled={Boolean(successMessage)}
                  onClick={handleRegister}
                  className="flex-1"
                >
                  {t('sign_up')}
                </Button>
              </div>
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

function RoleCard({
  selected,
  icon,
  iconBg,
  title,
  subtitle,
  bullets,
  onSelect,
}: {
  selected: boolean
  icon: React.ReactNode
  iconBg?: string
  title: string
  subtitle: string
  bullets: string[]
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('auth-role-card', selected && 'auth-role-card--selected')}
    >
      {selected && (
        <span className="auth-role-card__check">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--r-md)]"
        style={{ backgroundColor: iconBg ?? 'var(--color-primary-light)' }}
      >
        {icon}
      </div>
      <h3 className="text-[16px] font-bold text-[var(--kwork-text)]">{title}</h3>
      <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{subtitle}</p>
      <ul className="mt-3 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[12px] text-[var(--kwork-text-muted)]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--kwork-text-muted)]" />
            {b}
          </li>
        ))}
      </ul>
    </button>
  )
}

export function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  )
}
