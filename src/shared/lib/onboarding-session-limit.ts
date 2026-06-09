'use client'

import { useEffect, useState } from 'react'

const SESSION_KEY = 'ishbor-onboarding-sessions'
const MAX_SESSIONS = 3

export function shouldShowOnboardingChecklist(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const count = Number.parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10)
    return count < MAX_SESSIONS
  } catch {
    return true
  }
}

export function recordOnboardingChecklistSession(): void {
  if (typeof window === 'undefined') return
  try {
    const count = Number.parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10)
    if (count < MAX_SESSIONS) {
      localStorage.setItem(SESSION_KEY, String(count + 1))
    }
  } catch {
    /* ignore */
  }
}

/** Onboarding checklist ko'rinsa recommended banner yashiriladi */
export function useOnboardingChecklistVisible(onboardingComplete: boolean): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!onboardingComplete && shouldShowOnboardingChecklist())
  }, [onboardingComplete])

  return visible
}
