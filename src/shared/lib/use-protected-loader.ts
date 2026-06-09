'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuthReady } from '@/shared/lib/use-auth-ready'

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
  useLayoutEffect(() => {
    loaderRef.current = loader
  })

  const reload = useCallback(() => {
    if (!authed) return Promise.resolve()
    setLoading(true)
    setError(false)
    setLoadError(null)
    return loaderRef
      .current()
      .then((result) => {
        setData(result)
        setError(false)
        setLoadError(null)
      })
      .catch((e) => {
        setError(true)
        setLoadError(e)
      })
      .finally(() => setLoading(false))
  }, [authed])

  useEffect(() => {
    if (!ready) return
    if (!authed) {
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
