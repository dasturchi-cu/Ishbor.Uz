'use client'

import { useEffect } from 'react'

/** Closes overlay/drawer on Escape — accessibility (audit batch 4) */
export function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])
}
