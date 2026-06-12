'use client'

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { t, type Language, type TranslationKey } from '@/infrastructure/i18n'
import { isLocaleChunkLoaded, loadLocaleChunk } from '@/infrastructure/i18n/locale-loader'
import { isSupabaseConfigured, getSupabase } from '@/infrastructure/supabase/client'
import { clearAuthCache, getCachedSession, updateCachedSessionToken } from '@/infrastructure/auth/session-cache'
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/infrastructure/auth/profile-cache'
import { api } from '@/infrastructure/api/client'
import { clearDebouncedInvalidations } from '@/shared/lib/query-invalidate-debounce'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import type { ApiProfile } from '@/infrastructure/api/types'
import { useSessionIdleTimeout } from '@/shared/lib/use-session-idle'

type UserRole = 'freelancer' | 'client'

function readStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('userRole')
  if (saved === 'freelancer' || saved === 'client') return saved
  return null
}

function readInitialRole(): UserRole {
  return readStoredRole() ?? roleFromProfile(readCachedProfile())
}

function roleFromProfile(profile: ApiProfile | null | undefined): UserRole {
  return profile?.role === 'client' ? 'client' : 'freelancer'
}
export interface AppContextType {
  currentUserRole: 'freelancer' | 'client'
  setCurrentUserRole: (role: 'freelancer' | 'client') => Promise<void>
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
  mergeProfile: (patch: Partial<ApiProfile>) => void
  t: (key: TranslationKey) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const AUTH_DEFER_PREFIXES = [
  '/',
  '/services',
  '/projects',
  '/jobs',
  '/freelancers',
  '/companies',
  '/regions',
  '/pricing',
  '/help',
  '/blog',
  '/buyer-protection',
  '/terms',
  '/privacy',
]

function shouldDeferAuthSync(pathname: string): boolean {
  if (pathname === '/') return true
  return AUTH_DEFER_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  )
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>(readInitialRole)
  const activeRoleRef = useRef<UserRole>(currentUserRole)
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [language, setLanguage] = useState<'uz' | 'ru' | 'en'>('uz')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ApiProfile | null>(() => readCachedProfile())
  const [mounted, setMounted] = useState(false)
  const [localeReady, setLocaleReady] = useState(true)
  const profileRef = useRef<ApiProfile | null>(profile)
  const refreshInflight = useRef<Promise<void> | null>(null)

  useSessionIdleTimeout(isLoggedIn)

  useLayoutEffect(() => {
    profileRef.current = profile
  }, [profile])

  const persistRole = useCallback((role: UserRole) => {
    activeRoleRef.current = role
    setCurrentUserRoleState(role)
    localStorage.setItem('userRole', role)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    if (refreshInflight.current) return refreshInflight.current

    refreshInflight.current = (async () => {
      try {
        const session = await getCachedSession()
        if (!session) return

        setUserId(session.userId)
        setIsLoggedIn(true)

        let loaded: ApiProfile | null = null
        loaded = await api.getProfile()
        const role = roleFromProfile(loaded)
        activeRoleRef.current = role
        setCurrentUserRoleState(role)
        localStorage.setItem('userRole', role)
        const next = { ...loaded, role }
        setProfile(next)
        writeCachedProfile(next)

        const ui = loaded.ui_preferences
        if (ui?.theme === 'light' || ui?.theme === 'dark') {
          setThemeState(ui.theme)
          localStorage.setItem('theme', ui.theme)
          document.documentElement.classList.toggle('dark', ui.theme === 'dark')
        }
        if (ui?.language === 'uz' || ui?.language === 'ru' || ui?.language === 'en') {
          setLanguage(ui.language)
          localStorage.setItem('language', ui.language)
          document.documentElement.lang = ui.language
          if (ui.language !== 'uz' && !isLocaleChunkLoaded(ui.language)) {
            setLocaleReady(false)
            void loadLocaleChunk(ui.language).finally(() => setLocaleReady(true))
          }
        }
      } catch {
        // Vaqtinchalik API xatosi — eski profil va avatar saqlanadi
      }
    })().finally(() => {
      refreshInflight.current = null
    })

    return refreshInflight.current
  }, [])

  const mergeProfile = useCallback((patch: Partial<ApiProfile>) => {
    setProfile((prev) => {
      const base =
        prev ??
        (userId
          ? ({
              id: userId,
              role: activeRoleRef.current,
              full_name: null,
              email: null,
              phone: null,
              bio: null,
              region: null,
              specialty: null,
            } satisfies ApiProfile)
          : null)
      if (!base) return prev
      const next = { ...base, ...patch }
      writeCachedProfile(next)
      return next
    })
  }, [userId])

  const signOut = useCallback(async () => {
    clearDebouncedInvalidations()
    clearAuthCache()
    try {
      const [{ clearDashboardHomeCache }, { clearMergedActivityFeedCache }, { clearDashboardSummaryCache }] =
        await Promise.all([
          import('@/shared/lib/use-dashboard-home'),
          import('@/shared/lib/use-merged-activity-feed'),
          import('@/shared/lib/dashboard-summary-cache'),
        ])
      clearDashboardHomeCache(userId ?? undefined)
      clearDashboardSummaryCache()
      clearMergedActivityFeedCache()
    } catch {
      /* cache tozalash xatosi chiqishni bloklamasin */
    }
    clearCachedProfile()
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    }
    setIsLoggedIn(false)
    setUserId(null)
    setProfile(null)
    activeRoleRef.current = 'freelancer'
    setCurrentUserRoleState('freelancer')
    localStorage.removeItem('userRole')
  }, [userId])

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedLanguage = localStorage.getItem('language') as 'uz' | 'ru' | 'en' | null

    if (savedTheme) setThemeState(savedTheme)
    if (savedLanguage) {
      setLanguage(savedLanguage)
      document.documentElement.lang = savedLanguage
      if (savedLanguage !== 'uz' && !isLocaleChunkLoaded(savedLanguage)) {
        setLocaleReady(false)
        void loadLocaleChunk(savedLanguage).finally(() => setLocaleReady(true))
      }
    }

    const savedRole = readStoredRole()
    if (savedRole) {
      activeRoleRef.current = savedRole
      setCurrentUserRoleState(savedRole)
    }

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

    let cancelled = false
    let idleId: number | undefined
    let unsubscribe: (() => void) | undefined

    const startAuthSync = () => {
      if (cancelled) return

      const supabase = getSupabase()

      const syncSession = async () => {
        const authTimeout = window.setTimeout(() => {
          setIsAuthLoading(false)
        }, 10_000)

        setIsAuthLoading(true)
        try {
          const session = await getCachedSession()
          if (session) {
            setIsLoggedIn(true)
            setUserId(session.userId)
            if (!profileRef.current) {
              setTimeout(() => {
                refreshProfile().catch((e) => ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me' }))
              }, 0)
            }
          } else {
            setIsLoggedIn(false)
            setUserId(null)
          }
        } catch {
          setIsLoggedIn(false)
          setUserId(null)
        } finally {
          window.clearTimeout(authTimeout)
          setIsAuthLoading(false)
        }
      }

      void syncSession()

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.access_token && session.user) {
          updateCachedSessionToken(
            session.access_token,
            session.expires_at ?? 0,
            session.user.id,
          )
        }

        if (event === 'TOKEN_REFRESHED') return

        setIsLoggedIn(Boolean(session))
        setUserId(session?.user.id ?? null)

        const shouldRefresh =
          session &&
          (event === 'SIGNED_IN' ||
            event === 'USER_UPDATED' ||
            (event === 'INITIAL_SESSION' && !profileRef.current))

        if (shouldRefresh) {
          setTimeout(() => {
            refreshProfile().catch((e) => ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me' }))
          }, 0)
        } else if (!session) {
          clearAuthCache()
          clearCachedProfile()
          setProfile(null)
        }
      })

      unsubscribe = () => listener.subscription.unsubscribe()
    }

    if (shouldDeferAuthSync(pathname)) {
      const run = () => {
        if (!cancelled) startAuthSync()
      }
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(run, { timeout: 2500 })
      } else {
        idleId = window.setTimeout(run, 1200)
      }
    } else {
      startAuthSync()
    }

    return () => {
      cancelled = true
      if (typeof idleId === 'number') {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId)
        } else {
          window.clearTimeout(idleId)
        }
      }
      unsubscribe?.()
    }
  }, [mounted, pathname, refreshProfile])

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    if (userId) {
      api.updateUiPreferences({ theme: newTheme }).catch((e) =>
        ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me/ui-preferences' })
      )
    }
  }, [userId])

  const setRole = useCallback(
    async (role: UserRole) => {
      if (role === activeRoleRef.current) return
      const previous = activeRoleRef.current
      if (!userId) {
        persistRole(role)
        setProfile((prev) => (prev ? { ...prev, role } : prev))
        return
      }
      persistRole(role)
      setProfile((prev) => (prev ? { ...prev, role } : prev))
      try {
        const updated = await api.updateProfileRole(role)
        setProfile({ ...updated, role })
      } catch (e) {
        persistRole(previous)
        setProfile((prev) => (prev ? { ...prev, role: previous } : prev))
        ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me/role' })
        throw e
      }
    },
    [persistRole, userId],
  )

  const setLang = useCallback((lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
    if (lang !== 'uz' && !isLocaleChunkLoaded(lang)) {
      setLocaleReady(false)
      void loadLocaleChunk(lang).finally(() => setLocaleReady(true))
    }
    if (userId) {
      api.updateUiPreferences({ language: lang }).catch((e) =>
        ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me/ui-preferences' })
      )
    }
  }, [userId])

  const translate = useCallback(
    (key: TranslationKey) => {
      if (!localeReady && language !== 'uz') {
        return t('uz', key)
      }
      return t(language, key)
    },
    [language, localeReady],
  )

  const contextValue = useMemo<AppContextType>(
    () => ({
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
      mergeProfile,
      t: translate,
    }),
    [
      profile,
      currentUserRole,
      theme,
      language,
      isLoggedIn,
      isAuthLoading,
      userId,
      signOut,
      refreshProfile,
      mergeProfile,
      translate,
      setRole,
      setTheme,
      setLang,
    ]
  )

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
