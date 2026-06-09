'use client'

import { useEffect } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { resolveLoadError, type LoadErrorContext, type LoadErrorScope } from '@/shared/lib/load-error'
import { logClientError } from '@/shared/lib/log-client-error'

interface LoadErrorAlertProps {
  show?: boolean
  error?: unknown
  scope: LoadErrorScope
  onRetry?: () => void
  className?: string
  context?: Partial<LoadErrorContext>
}

export function LoadErrorAlert({
  show = true,
  error,
  scope,
  onRetry,
  className,
  context,
}: LoadErrorAlertProps) {
  const { t } = useApp()

  useEffect(() => {
    if (!show || !error) return
    logClientError(error, {
      scope,
      apiPath: context?.apiPath,
      queryKey: context?.queryKey,
      page: context?.page,
    })
  }, [show, error, scope, context?.apiPath, context?.queryKey, context?.page])

  if (!show) return null

  const message = error ? resolveLoadError(error, t, scope) : resolveLoadError(null, t, scope)

  return (
    <Alert variant="error" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={() => void onRetry()}>
            {t('catalog_retry')}
          </Button>
        ) : null}
      </div>
    </Alert>
  )
}
