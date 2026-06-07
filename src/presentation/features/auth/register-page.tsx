'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { ChevronRight, Check, Briefcase, Target } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { PATHS, dashboardPathForRole } from '@/domain/constants/routes'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'

export function RegisterPage() {
  const { t, setCurrentUserRole, refreshProfile } = useApp()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [role, setRole] = useState<'freelancer' | 'client' | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+998',
    password: '',
    confirmPassword: '',
    specialty: '',
    city: '',
    bio: '',
    agreeTerms: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const cities = UZ_REGIONS

  const handleRoleSelect = (selectedRole: 'freelancer' | 'client') => {
    setRole(selectedRole)
    setCurrentUserRole(selectedRole)
    setStep(2)
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = t('error_required')
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = t('error_email')
    if (!formData.password || formData.password.length < 8) newErrors.password = t('error_password_short')
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('error_password_mismatch')
    if (!formData.agreeTerms) newErrors.agreeTerms = t('error_agree_terms')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    setSuccessMessage(null)
    if (validateStep2()) {
      setStep(3)
    }
  }

  const handleRegister = async () => {
    setSuccessMessage(null)

    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: t('error_agree_terms') })
      return
    }

    if (!isSupabaseConfigured()) {
      setErrors({ submit: 'Supabase sozlanmagan. .env.local faylini tekshiring.' })
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
          },
        },
      })

      if (signUpError) {
        setErrors({ submit: mapAuthErrorMessage(signUpError.message, t) })
        return
      }

      if (data.session) {
        setCurrentUserRole(selectedRole)
        try {
          await api.updateProfile({
            role: selectedRole,
            full_name: formData.fullName,
            phone: formData.phone,
            region: formData.city,
            specialty: formData.specialty,
            bio: formData.bio,
          })
        } catch {
          // trigger profil yaratgan bo'lishi mumkin
        }
        await refreshProfile()
        router.push(dashboardPathForRole(selectedRole))
      } else {
        setSuccessMessage(
          'Email tasdiqlash havolasi yuborildi. Pochtangizni tekshiring, tasdiqlang va kirish qiling.'
        )
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ro'yxatdan o'tishda xatolik yuz berdi"
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative container-responsive py-12 min-h-screen flex items-center">
        <div className="w-full max-w-2xl mx-auto">
          {/* Step indicator */}
          {step > 1 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        s <= step
                          ? 'bg-white text-indigo-600 shadow-lg'
                          : 'bg-white/20 text-white/50'
                      }`}
                    >
                      {s < step ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded transition-all ${
                          s < step ? 'bg-white' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeInUp">
              <div className="text-center space-y-2 mb-12">
                <h1 className="text-4xl font-bold text-white">{t('select_role')}</h1>
                <p className="text-white/80">{t('register')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Freelancer Card */}
                <div
                  className="group glass-auth rounded-3xl p-8 text-center hover-lift transition-all border-2 border-transparent hover:border-white/50"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 text-white mb-4 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('role_freelancer')}</h2>
                  <p className="text-white/70 mb-6 text-sm">{t('freelancer_desc')}</p>
                  <div className="space-y-2 text-sm text-white/60 mb-6 text-left">
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Xizmat berib daromad qil</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> O'zingni ko'rsat</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Mijozlarni tap</p>
                  </div>
                  <Button
                    onClick={() => handleRoleSelect('freelancer')}
                    className="w-full bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                  >
                    {t('continue')}
                  </Button>
                </div>

                {/* Client Card */}
                <div
                  className="group glass-auth rounded-3xl p-8 text-center hover-lift transition-all border-2 border-transparent hover:border-white/50"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 text-white mb-4 group-hover:scale-105 transition-transform">
                    <Target className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('role_client')}</h2>
                  <p className="text-white/70 mb-6 text-sm">{t('client_desc')}</p>
                  <div className="space-y-2 text-sm text-white/60 mb-6 text-left">
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Freelancerlarga buyurtma ber</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Loyihani joylashtir</p>
                    <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Ishni tugatuvchi tap</p>
                  </div>
                  <Button
                    onClick={() => handleRoleSelect('client')}
                    className="w-full bg-amber-400 text-indigo-600 hover:bg-amber-300 font-semibold"
                  >
                    {t('continue')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: User Information */}
          {step === 2 && role && (
            <div className="glass-auth rounded-3xl p-12 space-y-6 animate-fadeInUp max-w-xl mx-auto">
              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">{t('your_info')}</h2>
                <p className="text-white/70">{t('account_info_desc')}</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">{t('full_name')}</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="Alisher Umarov"
                />
                {errors.fullName && <p className="text-red-300 text-sm mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-white font-medium mb-2">{t('email')}</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="alisher@example.com"
                />
                {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-white font-medium mb-2">{t('password')}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-white font-medium mb-2">{t('confirm_password')}</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-4">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-1"
                />
                <label className="text-white/80 text-sm">
                  {t('agree_terms')}
                </label>
              </div>
              {errors.agreeTerms && <p className="text-red-300 text-sm">{errors.agreeTerms}</p>}

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
                >
                  {t('back')}
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                >
                  {t('continue')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete Profile */}
          {step === 3 && role && (
            <div className="glass-auth rounded-3xl p-12 space-y-6 animate-fadeInUp max-w-xl mx-auto">
              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">{t('create_profile_title')}</h2>
                <p className="text-white/70">{t('initial_setup')}</p>
              </div>

              {successMessage && (
                <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-4 py-3 text-emerald-100 text-sm space-y-2">
                  <p>{successMessage}</p>
                  <Link href={PATHS.login} className="font-semibold underline hover:text-white">
                    {t('login')}
                  </Link>
                </div>
              )}

              {Object.keys(errors).length > 0 && (
                <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-red-100 text-sm">
                  {Object.values(errors).map((msg) => (
                    <p key={msg}>{msg}</p>
                  ))}
                </div>
              )}

              {role === 'freelancer' ? (
                <>
                  {/* Specialty */}
                  <div>
                    <label className="block text-white font-medium mb-2">{t('specialty')}</label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="select-auth"
                    >
                      <option value="">{t('select')}</option>
                      <option>{t('web_developer')}</option>
                      <option>{t('graphic_designer_opt')}</option>
                      <option>{t('ui_ux_designer')}</option>
                      <option>{t('content_writer_opt')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">{t('region')}</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="select-auth"
                    >
                      <option value="">{t('select')}</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-white font-medium mb-2">{t('bio')}</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 h-24 placeholder:text-white/40"
                      placeholder={t('describe_yourself')}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Company Name (for clients) */}
                  <div>
                    <label className="block text-white font-medium mb-2">{t('company_optional')}</label>
                    <Input
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder={t('company_name')}
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">{t('industry')}</label>
                    <select className="select-auth">
                      <option value="">{t('select')}</option>
                      <option>{t('technology')}</option>
                      <option>{t('marketing_industry')}</option>
                      <option>{t('ecommerce')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">{t('region')}</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="select-auth"
                    >
                      <option value="">{t('select')}</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="agreeTermsStep3"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeTerms: e.target.checked })
                    if (e.target.checked) {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.agreeTerms
                        return next
                      })
                    }
                  }}
                  className="mt-1"
                />
                <label htmlFor="agreeTermsStep3" className="text-white/80 text-sm">
                  {t('agree_terms')}
                </label>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
                >
                  {t('back')}
                </Button>
                <Button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading || Boolean(successMessage)}
                  className="flex-1 bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                >
                  {loading ? '...' : t('sign_up')}
                </Button>
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-white/70">
              {t('already_have_account')}{' '}
              <Link href={PATHS.login} className="text-white font-semibold hover:underline">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
