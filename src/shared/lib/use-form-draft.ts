'use client'

import { useEffect, useRef } from 'react'

/** localStorage draft — forma yo'qolmasligi uchun (audit batch 2) */
export function useFormDraft<T extends object>(key: string, value: T, enabled = true) {
  const hydrated = useRef(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota */
    }
  }, [key, value, enabled])

  return {
    hydrate(initial: T): T {
      if (hydrated.current || typeof window === 'undefined') return initial
      hydrated.current = true
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return initial
        return { ...initial, ...JSON.parse(raw) } as T
      } catch {
        return initial
      }
    },
    clear() {
      if (typeof window === 'undefined') return
      localStorage.removeItem(key)
    },
  }
}
