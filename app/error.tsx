'use client'

import { useEffect } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { PageErrorView } from '@/presentation/components/layout/page-error-view'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useApp()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageErrorView
      title={t('page_error_title')}
      description={t('page_error_desc')}
      onRetry={reset}
      digest={error.digest}
    />
  )
}
