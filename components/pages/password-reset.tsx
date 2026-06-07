'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

type ResetStep = 'request' | 'link-sent' | 'new-password' | 'success'

export default function PasswordReset() {
  const [step, setStep] = useState<ResetStep>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async () => {
    if (!email) {
      setError('Email is required')
      return
    }
    setLoading(true)
    setError('')

    setTimeout(() => {
      setLoading(false)
      setStep('link-sent')
    }, 1000)
  }

  const handleSetNewPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Both password fields are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1000)
  }

  const handleBackToRequest = () => {
    setStep('request')
    setEmail('')
    setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Request Reset */}
      {step === 'request' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="you@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-300 text-sm font-semibold">{error}</p>
              </div>
            )}

            <Button
              onClick={handleRequestReset}
              disabled={loading}
              className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              Back to Login
            </Button>
          </div>
        </div>
      )}

      {/* Link Sent */}
      {step === 'link-sent' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500/20 p-4 rounded-full animate-pulse">
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              Link expires in 24 hours
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Click the link in the email to proceed with resetting your password.
            </p>
          </div>

          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-lg p-4">
            <p className="text-sm text-amber-600 dark:text-amber-300">
              Didn't receive the email? Check your spam folder or try a different email.
            </p>
          </div>

          <Button
            onClick={handleBackToRequest}
            variant="outline"
            className="w-full"
          >
            Try Different Email
          </Button>
        </div>
      )}

      {/* New Password */}
      {step === 'new-password' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Create New Password</h2>
            <p className="text-muted-foreground">
              Enter a strong password to secure your account
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-300 font-semibold">
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-300 text-sm font-semibold">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSetNewPassword}
              disabled={loading}
              className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Password Reset Successfully</h2>
            <p className="text-muted-foreground">
              Your password has been updated. Log in with your new password.
            </p>
          </div>

          <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-300 font-semibold">
              You can now log in with your new password
            </p>
          </div>

          <Button
            className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
          >
            Go to Login
          </Button>
        </div>
      )}
    </div>
  )
}
