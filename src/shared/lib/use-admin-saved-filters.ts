'use client'

import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'ishbor-admin-filter:'

export function useAdminSavedFilters<T extends Record<string, unknown>>(
  key: string,
  defaults: T
): [T, (next: T) => void, () => void] {
  const storageKey = `${PREFIX}${key}`

  const [filters, setFilters] = useState<T>(() => {
    if (typeof window === 'undefined') return defaults
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      return { ...defaults, ...JSON.parse(raw) as T }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters))
    } catch {
      /* ignore quota errors */
    }
  }, [filters, storageKey])

  const update = useCallback((next: T) => {
    setFilters(next)
  }, [])

  const reset = useCallback(() => {
    setFilters(defaults)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }, [defaults, storageKey])

  return [filters, update, reset]
}
