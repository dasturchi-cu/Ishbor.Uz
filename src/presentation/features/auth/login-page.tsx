'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { PATHS, dashboardPathForRole } from '@/domain/constants/routes'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'

export function LoginPage() {
  const { t, setCurrentUserRole, refreshProfile, isLoggedIn, isAuthLoading, currentUserRole } = useApp()
  const router = useRouter()
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn) return
    router.replace(dashboardPathForRole(currentUserRole))
  }, [isAuthLoading, isLoggedIn, currentUserRole, router])

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('error_credentials_required'))
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabase()
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(mapAuthErrorMessage(authError.message, t))
          return
        }
        setCurrentUserRole(role)
        try {
          await api.updateProfile({ role })
        } catch {
          // profil keyin yangilanadi
        }
        await refreshProfile()
        router.replace(dashboardPathForRole(role))
      } else {
        setError('Supabase sozlanmagan. .env.local faylini tekshiring.')
      }
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

      <div className="relative container-responsive py-12 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Card */}
          <div className="glass-auth rounded-3xl p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-white mb-2">IshBor</div>
              <h1 className="text-2xl font-bold text-white">{t('login')}</h1>
              <p className="text-white/70 text-sm">{t('login_welcome')}</p>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-3 p-1 bg-white/10 rounded-lg">
              {['freelancer', 'client'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r as 'freelancer' | 'client')
                    setError('')
                  }}
                  className={`flex-1 py-2 rounded-md font-medium transition-all ${
                    role === r
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {r === 'freelancer' ? t('role_freelancer_label') : t('role_client_label')}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-white/90 font-medium text-sm">{t('email')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:bg-white/15"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-white/90 font-medium text-sm">{t('password')}</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:bg-white/15 pr-10"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/70 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded"
                />
                {t('remember_me')}
              </label>
              <button
                onClick={() => alert('Parol tiklash tez orada qo\'shiladi')}
                className="text-white/70 hover:text-white transition-colors underline"
              >
                {t('forgot_password')}
              </button>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white text-indigo-600 hover:bg-white/90 font-bold py-3 h-auto text-base shadow-lg"
            >
              {loading ? '...' : t('sign_in')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-white/70 backdrop-blur-sm">
                  {t('or')}
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
              >
                <span className="text-lg">G</span>
                oogle
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white"
              >
                <span className="text-lg">f</span>
                acebook
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center space-y-2 pt-4 border-t border-white/20">
              <p className="text-white/70 text-sm">
                {t('no_account')}{' '}
                <Link href={PATHS.register} className="text-white font-semibold hover:text-white/80 transition-colors">
                  {t('sign_up')}
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 glass-auth rounded-2xl p-6 text-sm">
            <p className="text-white/60 mb-3 font-medium">{t('demo_account')}</p>
            <div className="space-y-1 text-white/70">
              <p>{t('email')}: <span className="font-mono text-white">demo@ishbor.uz</span></p>
              <p>{t('password')}: <span className="font-mono text-white">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
