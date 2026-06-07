'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface AppContextType {
  currentUserRole: 'freelancer' | 'client'
  setCurrentUserRole: (role: 'freelancer' | 'client') => void
  currentPage: string
  setCurrentPage: (page: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  language: 'uz' | 'ru' | 'en'
  setLanguage: (lang: 'uz' | 'ru' | 'en') => void
  isLoggedIn: boolean
  setIsLoggedIn: (loggedIn: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<'freelancer' | 'client'>('freelancer')
  const [currentPage, setCurrentPage] = useState('landing')
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [language, setLanguage] = useState<'uz' | 'ru' | 'en'>('uz')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme and language from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedLanguage = localStorage.getItem('language') as 'uz' | 'ru' | 'en' | null
    const savedUserRole = localStorage.getItem('userRole') as 'freelancer' | 'client' | null

    if (savedTheme) setThemeState(savedTheme)
    if (savedLanguage) setLanguage(savedLanguage)
    if (savedUserRole) setCurrentUserRole(savedUserRole)

    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

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

  const setLang = (lang: 'uz' | 'ru' | 'en') => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  if (!mounted) {
    return <>{children}</>
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
