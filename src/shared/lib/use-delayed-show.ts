'use client'

import { useEffect, useState } from 'react'

/** Skeleton flash kamaytirish — 300ms dan keyin ko'rsatish */
export function useDelayedShow(active: boolean, delayMs = 300): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!active) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => setShow(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  return show
}
