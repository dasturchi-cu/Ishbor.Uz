'use client'

import { useEffect } from 'react'

/** Prevents background scroll when drawer/modal is open (audit batch 5) */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}
