'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getCachedAccessToken, refreshCachedSession } from '@/infrastructure/auth/session-cache'
import { useAuthReady } from '@/shared/lib/use-auth-ready'

async function ensureAccessToken(): Promise<boolean> {
  if (await getCachedAccessToken()) return true
  const session = await refreshCachedSession()
  return Boolean(session?.accessToken)
}

/** Dashboard/admin: auth tayyor bo'lguncha kutadi, xatolikda reload beradi */
export function useProtectedLoader<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
) {
  const { ready, authed } = useAuthReady()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)
  const loaderRef = useRef(loader)
  const loadGenRef = useRef(0)

  useLayoutEffect(() => {
    loaderRef.current = loader
  })

  const reload = useCallback(() => {
    if (!authed) return Promise.resolve()
    const gen = ++loadGenRef.current
    setLoading(true)
    setError(false)
    setLoadError(null)
    return ensureAccessToken()
      .then((hasToken) => {
        if (gen !== loadGenRef.current) return undefined
        if (!hasToken) {
          setError(true)
          setLoadError(new Error('Auth token yo\'q'))
          return undefined
        }
        return loaderRef.current()
      })
      .then((result) => {
        if (gen !== loadGenRef.current || result === undefined) return
        setData(result)
        setError(false)
        setLoadError(null)
      })
      .catch((e) => {
        if (gen !== loadGenRef.current) return
        setError(true)
        setLoadError(e)
      })
      .finally(() => {
        if (gen === loadGenRef.current) setLoading(false)
      })
  }, [authed])

  useEffect(() => {
    if (!ready) return
    if (!authed) {
      loadGenRef.current += 1
      setLoading(false)
      setError(false)
      setLoadError(null)
      setData(null)
      return
    }
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed explicitly
  }, [ready, authed, reload, ...deps])

  return { data, loading: !ready || loading, error, loadError, reload, ready, authed }
}
