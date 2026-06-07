'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

type VerificationStep = 'enter-email' | 'code-sent' | 'enter-code' | 'verified'

export default function EmailVerification() {
  const [step, setStep] = useState<VerificationStep>('enter-email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!email) {
      setError('Email is required')
      return
    }
    setLoading(true)
    setError('')
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setStep('code-sent')
    }, 1000)
  }

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }
    setLoading(true)
    setError('')
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setStep('verified')
    }, 1000)
  }

  const handleResendCode = () => {
    setStep('code-sent')
    setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Enter Email */}
      {step === 'enter-email' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
            <p className="text-muted-foreground">
              We'll send a code to your email to confirm your account
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
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        </div>
      )}

      {/* Code Sent */}
      {step === 'code-sent' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500/20 p-4 rounded-full animate-pulse">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
            <p className="text-muted-foreground">
              We sent a 6-digit verification code to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Code expires in 10 minutes. Check your spam folder if you don't see it.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Verification Code</label>
              <Input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setError('')
                }}
                placeholder="000000"
                maxLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-2xl tracking-widest font-bold"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-300 text-sm font-semibold">{error}</p>
              </div>
            )}

            <Button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <Button
              onClick={handleResendCode}
              variant="outline"
              className="w-full"
            >
              Resend Code
            </Button>
          </div>
        </div>
      )}

      {/* Verified */}
      {step === 'verified' && (
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Email Verified</h2>
            <p className="text-muted-foreground">
              Your email has been successfully verified. Your account is ready to use.
            </p>
          </div>

          <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-300 font-semibold">
              You can now log in and start using IshBor.uz
            </p>
          </div>

          <Button
            className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
          >
            Continue to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
