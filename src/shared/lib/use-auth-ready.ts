'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useApp } from '@/application/providers/app-provider'

/** Auth holati tayyor bo'lguncha dashboard/admin so'rovlarini kechiktirish */
export function useAuthReady() {
  const { userId, isAuthLoading, isLoggedIn } = useApp()
  const ready = !isAuthLoading
  const authed = ready && isLoggedIn && Boolean(userId)
  return { ready, authed, userId: userId ?? null, isAuthLoading, isLoggedIn }
}

/** Faqat login + token tayyor bo'lganda effect ishga tushadi */
export function useAuthedEffect(
  effect: (userId: string) => void | (() => void),
  deps: unknown[] = []
) {
  const { ready, authed, userId } = useAuthReady()
  const effectRef = useRef(effect)
  useLayoutEffect(() => {
    effectRef.current = effect
  })

  useEffect(() => {
    if (!ready || !authed || !userId) return
    return effectRef.current(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed explicitly
  }, [ready, authed, userId, ...deps])
}
