'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function RegisterPage() {
  const { setCurrentPage, setIsLoggedIn, currentUserRole, setCurrentUserRole } = useApp()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    city: '',
    title: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Complete registration
      setIsLoggedIn(true)
      setCurrentPage(currentUserRole === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Card className="p-8">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex-1 h-1 rounded-full transition ${
                  num <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-2 text-foreground">Create Your Account</h1>
          <p className="text-muted-foreground mb-8">Step {step} of 3</p>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <p className="text-foreground font-semibold mb-4">What do you want to do?</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'freelancer', label: 'I&apos;m a Freelancer', desc: 'Offer my skills' },
                  { id: 'client', label: 'I&apos;m a Client', desc: 'Hire freelancers' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setCurrentUserRole(option.id as 'freelancer' | 'client')}
                    className={`p-4 border-2 rounded-lg transition text-center ${
                      currentUserRole === option.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold text-foreground">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground">Full Name</label>
                <Input
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Phone</label>
                <Input
                  placeholder="+998 (XX) XXX-XX-XX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 3: Profile Setup */}
          {step === 3 && (
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground">City</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Select your city</option>
                  {['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan'].map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {currentUserRole === 'freelancer' && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Professional Title</label>
                    <Input
                      placeholder="e.g., UI/UX Designer"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground">Bio</label>
                    <textarea
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none h-24"
                    />
                  </div>
                </>
              )}

              {currentUserRole === 'client' && (
                <div>
                  <label className="text-sm font-semibold text-foreground">Company Name</label>
                  <Input
                    placeholder="Your company name"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              className="flex-1 gap-2"
            >
              {step === 3 ? 'Create Account' : 'Next'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <button
              onClick={() => setCurrentPage('login')}
              className="text-primary hover:underline font-semibold"
            >
              Sign In
            </button>
          </p>
        </Card>
      </div>
    </div>
  )
}
