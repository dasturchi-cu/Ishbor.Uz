'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Check } from 'lucide-react'

export function RegisterPage() {
  const { t, setCurrentPage, setCurrentUserRole, setIsLoggedIn } = useApp()
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

  const cities = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijan', 'Fergona', 'Xorazm', 'Qashqadarya']

  const handleRoleSelect = (selectedRole: 'freelancer' | 'client') => {
    setRole(selectedRole)
    setCurrentUserRole(selectedRole)
    setStep(2)
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Required'
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email'
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Min 8 chars'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords must match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep2()) {
      setStep(3)
    }
  }

  const handleRegister = () => {
    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: 'You must agree to terms' })
      return
    }
    setCurrentUserRole(role || 'freelancer')
    setIsLoggedIn(true)
    setCurrentPage(role === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')
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
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    💼
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('role_freelancer')}</h2>
                  <p className="text-white/70 mb-6 text-sm">{t('freelancer_desc')}</p>
                  <div className="space-y-2 text-sm text-white/60 mb-6 text-left">
                    <p>✓ Xizmat berib daromad qil</p>
                    <p>✓ O'zingni ko'rsat</p>
                    <p>✓ Mijozlarni tap</p>
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
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('role_client')}</h2>
                  <p className="text-white/70 mb-6 text-sm">{t('client_desc')}</p>
                  <div className="space-y-2 text-sm text-white/60 mb-6 text-left">
                    <p>✓ Freelancerlarga buyurtma ber</p>
                    <p>✓ Loyihani joylashtir</p>
                    <p>✓ Ishni tugatuvchi tap</p>
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
                <h2 className="text-3xl font-bold text-white">Ma'lumotlaringiz</h2>
                <p className="text-white/70">Hisob yaratish uchun zarur ma'lumot</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-white font-medium mb-2">Ism va Familiya</label>
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
                <label className="block text-white font-medium mb-2">Email</label>
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
                <label className="block text-white font-medium mb-2">Parol</label>
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
                <label className="block text-white font-medium mb-2">Parolni Tasdiqlang</label>
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
                  Shartlari va qoidalariga rozilik bildiryapman
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
                >
                  Orqaga
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                >
                  Davom etish
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete Profile */}
          {step === 3 && role && (
            <div className="glass-auth rounded-3xl p-12 space-y-6 animate-fadeInUp max-w-xl mx-auto">
              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">Profilingizni Yarating</h2>
                <p className="text-white/70">Dastlabki o'rnatish</p>
              </div>

              {role === 'freelancer' ? (
                <>
                  {/* Specialty */}
                  <div>
                    <label className="block text-white font-medium mb-2">Mutaxassislik</label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                    >
                      <option value="">Tanlang</option>
                      <option>Web Developer</option>
                      <option>Graphic Designer</option>
                      <option>UI/UX Designer</option>
                      <option>Content Writer</option>
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-white font-medium mb-2">Shahar</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                    >
                      <option value="">Tanlang</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-white font-medium mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 h-24 placeholder:text-white/40"
                      placeholder="O'zingizni batafsil tavsiflang..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Company Name (for clients) */}
                  <div>
                    <label className="block text-white font-medium mb-2">Kompaniya (ixtiyoriy)</label>
                    <Input
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Kompaniya nomi"
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-white font-medium mb-2">Soha</label>
                    <select className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2">
                      <option value="">Tanlang</option>
                      <option>Technology</option>
                      <option>Marketing</option>
                      <option>E-commerce</option>
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-white font-medium mb-2">Shahar</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                    >
                      <option value="">Tanlang</option>
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
                >
                  Orqaga
                </Button>
                <Button
                  onClick={handleRegister}
                  className="flex-1 bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                >
                  Ro'yxatdan O'tish
                </Button>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-white/70">
              Allaqachon hisob bor?{' '}
              <button
                onClick={() => setCurrentPage('login')}
                className="text-white font-semibold hover:underline"
              >
                Kirish
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
