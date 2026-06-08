'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { toast } from '@/presentation/components/ui/toast'

export function AdminDeniedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useApp()

  useEffect(() => {
    if (searchParams.get('admin_denied') !== '1') return
    toast.error(t('admin_access_denied'))
    const url = new URL(window.location.href)
    url.searchParams.delete('admin_denied')
    router.replace(url.pathname + url.search)
  }, [searchParams, router, t])

  return null
}
