'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { toast } from '@/presentation/components/ui/toast'

/** Middleware `admin_denied=1` paramini toast qiladi (audit batch 3) */
export function useAdminDeniedToast() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useApp()

  useEffect(() => {
    if (searchParams.get('admin_denied') !== '1') return
    toast.error(t('admin_access_denied'))
    const next = new URLSearchParams(searchParams.toString())
    next.delete('admin_denied')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [searchParams, pathname, router, t])
}
