'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

export function LoginPagePremium() {
  const { t, setCurrentPage, setIsLoggedIn } = useApp()
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!email || !password) {
      setError('Email and password required')
      return
    }
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

      <div className="relative container-responsive py-12 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Card */}
          <div className="glass rounded-3xl p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-white mb-2">IshBor</div>
              <h1 className="text-2xl font-bold text-white">{t('login')}</h1>
              <p className="text-white/80 text-sm font-medium">Platformaga xush kelibsiz</p>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-3 p-1 bg-white/15 rounded-lg">
              {['freelancer', 'client'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r as 'freelancer' | 'client')
                    setError('')
                  }}
                  className={`flex-1 py-2 rounded-md font-bold transition-all ${
                    role === r
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-white hover:text-white/90'
                  }`}
                >
                  {r === 'freelancer' ? 'Freelancer' : 'Client'}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/15 border-2 border-red-500/80 rounded-lg p-4 animate-slideDown">
                <p className="text-red-600 dark:text-red-300 text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-white font-extrabold text-sm uppercase tracking-widest">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className="bg-white/40 border-2 border-white/50 text-white placeholder:text-white/85 focus:border-white focus:bg-white/45 font-semibold text-base leading-6"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-white font-extrabold text-sm uppercase tracking-widest">Parol</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="bg-white/40 border-2 border-white/50 text-white placeholder:text-white/85 focus:border-white focus:bg-white/45 pr-10 font-semibold text-base leading-6"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors font-bold"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm gap-3">
              <label className="flex items-center gap-3 text-white/80 cursor-pointer hover:text-white transition-colors font-semibold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-white w-5 h-5 cursor-pointer mt-px"
                  aria-label="Remember me"
                />
                <span>Meni eslab qol</span>
              </label>
              <button
                onClick={() => alert('Password reset would be implemented')}
                className="text-white font-semibold hover:text-white/90 transition-colors underline underline-offset-2"
              >
                Parolni unutdim?
              </button>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full bg-white text-indigo-600 hover:bg-white/90 font-extrabold py-4 h-12 text-base shadow-lg rounded-lg transition-all"
              aria-label="Sign in to your account"
            >
              {t('sign_in')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-b from-indigo-600 to-purple-700 text-white/60">
                  yoki
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <span className="text-lg">G</span>
                oogle
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <span className="text-lg">f</span>
                acebook
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center space-y-2 pt-4 border-t border-white/20">
              <p className="text-white/85 text-sm font-semibold">
                Hisob yo'qmi?{' '}
                <button
                  onClick={() => setCurrentPage('register')}
                  className="text-white font-extrabold hover:text-white/90 transition-colors underline underline-offset-2"
                  aria-label="Go to registration page"
                >
                  Ro'yxatdan O'tish
                </button>
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 glass rounded-2xl p-6 text-sm">
            <p className="text-white font-bold mb-3">Demo hisob (test uchun):</p>
            <div className="space-y-1 text-white/80 font-medium">
              <p>Email: <span className="font-mono text-white">demo@ishbor.uz</span></p>
              <p>Password: <span className="font-mono text-white">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
