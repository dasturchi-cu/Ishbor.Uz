'use client'

import React, { Suspense, useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function NavbarInner() {
  const { theme, setTheme, language, setLanguage, isLoggedIn, setIsLoggedIn, currentPage, setCurrentPage, currentUserRole } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div
          onClick={() => handleNavigation('landing')}
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
                onClick={() => handleNavigation(currentUserRole === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')}
                active={currentPage === 'freelancer-dashboard' || currentPage === 'client-dashboard'}
              >
                Dashboard
              </NavButton>
              <NavButton
                onClick={() => handleNavigation('services-catalog')}
                active={currentPage === 'services-catalog'}
              >
                Services
              </NavButton>
              <NavButton
                onClick={() => handleNavigation('messages')}
                active={currentPage === 'messages'}
              >
                Messages
              </NavButton>
              <NavButton
                onClick={() => handleNavigation('wallet')}
                active={currentPage === 'wallet'}
              >
                Wallet
              </NavButton>
            </>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-1 border border-border rounded-lg p-1">
            {(['uz', 'ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'px-2 py-1 text-xs font-bold rounded transition-colors',
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
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {!isLoggedIn ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('login')}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavigation('register')}
                >
                  Join
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoggedIn(false)
                  handleNavigation('landing')
                }}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-slideDown">
          <div className="px-4 py-3 space-y-2">
              {/* Mobile Language Selector */}
            <div className="pb-3 border-b border-border">
              <p className="text-xs font-bold text-foreground mb-2">Language</p>
              <div className="flex gap-2">
                {(['uz', 'ru', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                    }}
                    className={cn(
                      'px-3 py-1 text-xs font-bold rounded transition-colors',
                      language === lang
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Navigation */}
            {isLoggedIn && (
              <div className="space-y-2 py-2 border-b border-border">
                <MobileNavButton
                  onClick={() => handleNavigation(currentUserRole === 'freelancer' ? 'freelancer-dashboard' : 'client-dashboard')}
                  active={currentPage === 'freelancer-dashboard' || currentPage === 'client-dashboard'}
                >
                  Dashboard
                </MobileNavButton>
                <MobileNavButton
                  onClick={() => handleNavigation('services-catalog')}
                  active={currentPage === 'services-catalog'}
                >
                  Services
                </MobileNavButton>
                <MobileNavButton
                  onClick={() => handleNavigation('messages')}
                  active={currentPage === 'messages'}
                >
                  Messages
                </MobileNavButton>
                <MobileNavButton
                  onClick={() => handleNavigation('wallet')}
                  active={currentPage === 'wallet'}
                >
                  Wallet
                </MobileNavButton>
              </div>
            )}

            {/* Mobile Auth Buttons */}
            <div className="pt-2 space-y-2">
              {!isLoggedIn ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('login')}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleNavigation('register')}
                    className="w-full"
                  >
                    Join Now
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoggedIn(false)
                    handleNavigation('landing')
                  }}
                  className="w-full"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
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

function MobileNavButton({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-left',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-secondary'
      )}
    >
      {children}
    </button>
  )
}
