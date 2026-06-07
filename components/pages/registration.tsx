'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, CheckCircle2, AlertCircle, Users } from 'lucide-react'

export default function Registration() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState<'freelancer' | 'client'>('freelancer')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!agreeTerms) {
      setError('Please accept the terms and conditions')
      return false
    }
    return true
  }

  const handleRegister = async () => {
    setError('')
    if (!validateForm()) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setRegistered(true)
    }, 1500)
  }

  if (registered) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="space-y-6 glass rounded-2xl p-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Registration Complete</h2>
            <p className="text-muted-foreground">
              Welcome to IshBor.uz! Check your email to verify your account.
            </p>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              Next steps:
            </p>
            <ol className="text-xs text-blue-600 dark:text-blue-300 space-y-1 ml-4 list-decimal">
              <li>Check your email for verification link</li>
              <li>Click the link to activate your account</li>
              <li>Complete your profile setup</li>
              <li>Start finding work or hiring talent</li>
            </ol>
          </div>

          <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12">
            Go to Email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 glass rounded-2xl p-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
          <p className="text-muted-foreground text-sm">
            Join thousands of freelancers and businesses on IshBor.uz
          </p>
        </div>

        {/* User Type Selection */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground">I want to:</p>
          <div className="grid grid-cols-2 gap-3">
            {['freelancer', 'client'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setUserType(type as 'freelancer' | 'client')
                  setError('')
                }}
                className={`p-4 rounded-lg border-2 transition-all font-bold text-center ${
                  userType === type
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                {type === 'freelancer' ? 'Find Work' : 'Hire Talent'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setError('')
              }}
              placeholder="John Doe"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Email</label>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Password</label>
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

          {/* Confirm Password */}
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

          {/* Terms */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked)
                setError('')
              }}
              className="w-5 h-5 rounded accent-white cursor-pointer"
            />
            <span className="text-sm text-white/80 font-medium">
              I agree to the{' '}
              <button className="text-white font-bold hover:underline">Terms of Service</button> and{' '}
              <button className="text-white font-bold hover:underline">Privacy Policy</button>
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-white/70">
            Already have an account?{' '}
            <button className="text-white font-bold hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  )
}
