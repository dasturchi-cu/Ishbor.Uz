'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function LoginPage() {
  const { setCurrentPage, setIsLoggedIn, currentUserRole, setCurrentUserRole } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (email && password) {
      setIsLoggedIn(true)
      setCurrentPage(currentUserRole === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Sign In</h1>
          <p className="text-muted-foreground mb-8">Welcome back to IshBor.uz</p>

          {/* Role Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg">
            {[
              { id: 'freelancer', label: 'Freelancer' },
              { id: 'client', label: 'Client' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setCurrentUserRole(role.id as 'freelancer' | 'client')}
                className={`flex-1 py-2 rounded transition font-semibold text-sm ${
                  currentUserRole === role.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full mb-4"
          >
            Sign In
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Login (Mock) */}
          <Button
            variant="outline"
            className="w-full gap-2"
          >
            <span>🔵</span> Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setCurrentPage('register')}
              className="text-primary hover:underline font-semibold"
            >
              Create one
            </button>
          </p>
        </Card>
      </div>
    </div>
  )
}
