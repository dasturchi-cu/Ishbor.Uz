'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { t, type Language, type TranslationKey } from '@/infrastructure/i18n'
import { isSupabaseConfigured, getSupabase } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import type { ApiProfile } from '@/infrastructure/api/types'
import type { AppRoute } from '@/domain/constants/routes'
import { APP_ROUTES } from '@/domain/constants/routes'

export interface AppContextType {
  currentUserRole: 'freelancer' | 'client'
  setCurrentUserRole: (role: 'freelancer' | 'client') => void
  currentPage: AppRoute
  setCurrentPage: (page: AppRoute) => void
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
  const [currentPage, setCurrentPage] = useState<AppRoute>(APP_ROUTES.landing)
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
      const supabase = getSupabase()
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (session?.user?.id) {
        setUserId(session.user.id)
        setIsLoggedIn(true)
      }
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
      const { data } = await supabase.auth.getSession()
      const session = data.session
      setIsLoggedIn(Boolean(session))
      setUserId(session?.user.id ?? null)
      if (session) {
        // onAuthStateChange deadlock dan qochish uchun defer
        setTimeout(() => {
          refreshProfile().catch(() => {})
        }, 0)
      }
      setIsAuthLoading(false)
    }

    syncSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session))
      setUserId(session?.user.id ?? null)
      if (session) {
        // Supabase: async ishni callback ichida to'g'ridan-to'g'ri chaqirmang — deadlock
        setTimeout(() => {
          refreshProfile().catch(() => {})
        }, 0)
      } else {
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
          currentPage,
          setCurrentPage,
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
        currentPage,
        setCurrentPage,
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
