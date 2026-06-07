'use client'

import React, { Suspense } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

function NavbarInner() {
  const { theme, setTheme, language, setLanguage, isLoggedIn, setIsLoggedIn, currentPage, setCurrentPage, currentUserRole } = useApp()

  return (
    <>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div
          onClick={() => setCurrentPage('landing')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
            IB
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline group-hover:text-primary transition">IshBor</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {isLoggedIn && (
            <>
              <NavButton
                onClick={() => setCurrentPage(currentUserRole === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')}
                active={currentPage === 'freelancer-dashboard' || currentPage === 'client-dashboard'}
              >
                Dashboard
              </NavButton>
              <NavButton
                onClick={() => setCurrentPage('services-catalog')}
                active={currentPage === 'services-catalog'}
              >
                Services
              </NavButton>
              <NavButton
                onClick={() => setCurrentPage('messages')}
                active={currentPage === 'messages'}
              >
                Messages
              </NavButton>
              <NavButton
                onClick={() => setCurrentPage('wallet')}
                active={currentPage === 'wallet'}
              >
                Wallet
              </NavButton>
            </>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            {(['uz', 'ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Auth Buttons */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage('login')}
                className="hidden sm:inline"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentPage('register')}
              >
                Join
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoggedIn(false)
                setCurrentPage('landing')
              }}
            >
              Logout
            </Button>
          )}

          {/* Mobile Menu Placeholder */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  )
}

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <Suspense fallback={<div className="h-16 flex items-center px-4" />}>
        <NavbarInner />
      </Suspense>
    </nav>
  )
}

function NavButton({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-secondary'
      )}
    >
      {children}
    </button>
  )
}
