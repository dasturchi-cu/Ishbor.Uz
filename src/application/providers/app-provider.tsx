'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { t, type Language, type TranslationKey } from '@/infrastructure/i18n'
import { isSupabaseConfigured, getSupabase } from '@/infrastructure/supabase/client'
import { clearAuthCache, getCachedSession } from '@/infrastructure/auth/session-cache'
import { api } from '@/infrastructure/api/client'
import type { ApiProfile } from '@/infrastructure/api/types'
export interface AppContextType {
  currentUserRole: 'freelancer' | 'client'
  setCurrentUserRole: (role: 'freelancer' | 'client') => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  language: Language
  setLanguage: (lang: Language) => void
  isLoggedIn: boolean
  setIsLoggedIn: (loggedIn: boolean) => void
  isAuthLoading: boolean
  userId: string | null
  profile: ApiProfile | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  t: (key: TranslationKey) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<'freelancer' | 'client'>('freelancer')
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [language, setLanguage] = useState<'uz' | 'ru' | 'en'>('uz')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured())
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [mounted, setMounted] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    try {
      const session = await getCachedSession()
      if (!session) return

      setUserId(session.userId)
      setIsLoggedIn(true)

      const loaded = await api.getProfile()
      setProfile(loaded)
      if (loaded.role === 'freelancer' || loaded.role === 'client') {
        setCurrentUserRole(loaded.role)
        localStorage.setItem('userRole', loaded.role)
      }
    } catch {
      // Profil yuklanmasa sessiyani saqlab qolamiz
    }
  }, [])

  const signOut = useCallback(async () => {
    clearAuthCache()
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    }
    setIsLoggedIn(false)
    setUserId(null)
    setProfile(null)
    localStorage.removeItem('userRole')
  }, [])

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedLanguage = localStorage.getItem('language') as 'uz' | 'ru' | 'en' | null
    const savedUserRole = localStorage.getItem('userRole') as 'freelancer' | 'client' | null

    if (savedTheme) setThemeState(savedTheme)
    if (savedLanguage) setLanguage(savedLanguage)
    if (savedUserRole) setCurrentUserRole(savedUserRole)

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (!mounted || !isSupabaseConfigured()) {
      setIsAuthLoading(false)
      return
    }

    const supabase = getSupabase()

    const syncSession = async () => {
      try {
        const session = await getCachedSession()
        if (session) {
          setIsLoggedIn(true)
          setUserId(session.userId)
          setTimeout(() => {
            refreshProfile().catch(() => {})
          }, 0)
        } else {
          setIsLoggedIn(false)
          setUserId(null)
        }
      } catch {
        setIsLoggedIn(false)
        setUserId(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    syncSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        clearAuthCache()
        return
      }

      setIsLoggedIn(Boolean(session))
      setUserId(session?.user.id ?? null)

      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        if (event === 'SIGNED_IN') clearAuthCache()
        setTimeout(() => {
          refreshProfile().catch(() => {})
        }, 0)
      } else if (!session) {
        clearAuthCache()
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [mounted, refreshProfile])

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setRole = (role: 'freelancer' | 'client') => {
    setCurrentUserRole(role)
    localStorage.setItem('userRole', role)
  }

  const setLang = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  if (!mounted) {
    return (
      <AppContext.Provider
        value={{
          currentUserRole,
          setCurrentUserRole: setRole,
          theme,
          setTheme,
          language,
          setLanguage: setLang,
          isLoggedIn,
          setIsLoggedIn,
          isAuthLoading,
          userId,
          profile,
          signOut,
          refreshProfile,
          t: (key) => t(language, key),
        }}
      >
        {children}
      </AppContext.Provider>
    )
  }

  return (
    <AppContext.Provider
      value={{
        currentUserRole,
        setCurrentUserRole: setRole,
        theme,
        setTheme,
        language,
        setLanguage: setLang,
        isLoggedIn,
        setIsLoggedIn,
        isAuthLoading,
        userId,
        profile,
        signOut,
        refreshProfile,
        t: (key) => t(language, key),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
