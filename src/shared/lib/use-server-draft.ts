'use client'

import { useCallback, useEffect, useRef } from 'react'
import { api } from '@/infrastructure/api/client'
import { useFormDraft } from '@/shared/lib/use-form-draft'

/** Hybrid draft: localStorage (instant) + Supabase (cross-device recovery) */
export function useServerDraft<T extends object>(
  draftKey: string,
  value: T,
  enabled = true,
  onRemoteRestore?: (payload: T) => void,
) {
  const local = useFormDraft<T>(`draft:${draftKey}`, value, enabled)
  const synced = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onRemoteRestoreRef = useRef(onRemoteRestore)

  useEffect(() => {
    onRemoteRestoreRef.current = onRemoteRestore
  }, [onRemoteRestore])

  const hydrate = useCallback(
    (initial: T): T => {
      return local.hydrate(initial)
    },
    [local],
  )

  useEffect(() => {
    if (!enabled || synced.current) return
    synced.current = true
    api
      .getDraft(draftKey)
      .then((remote) => {
        if (!remote?.payload || typeof remote.payload !== 'object') return
        try {
          localStorage.setItem(`draft:${draftKey}`, JSON.stringify(remote.payload))
        } catch {
          /* quota */
        }
        onRemoteRestoreRef.current?.(remote.payload as T)
      })
      .catch(() => undefined)
  }, [draftKey, enabled])

  useEffect(() => {
    if (!enabled) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.saveDraft(draftKey, value as Record<string, unknown>).catch(() => undefined)
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [draftKey, value, enabled])

  const clear = useCallback(() => {
    local.clear()
    api.deleteDraft(draftKey).catch(() => undefined)
  }, [draftKey, local])

  return { hydrate, clear }
}
