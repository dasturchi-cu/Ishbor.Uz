'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  isPasswordRecoveryUrl,
  passwordRecoveryRedirectUrl,
  readBrowserRecoveryUrl,
} from '@/infrastructure/auth/recovery'

/** Recovery tokenlari noto'g'ri sahifaga tushsa — reset-password ga yo'naltiradi */
export function PasswordRecoveryRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loc = readBrowserRecoveryUrl()
    if (!loc) return
    if (!isPasswordRecoveryUrl(loc.search, loc.hash, loc.pathname)) return

    const target = passwordRecoveryRedirectUrl(loc.search, loc.hash)
    router.replace(target)
  }, [pathname, router])

  return null
}
