'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={4000}
      closeButton
      richColors
      toastOptions={{
        style: {
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          borderRadius: 'var(--r-lg)',
        },
      }}
    />
  )
}

import { toast } from 'sonner'

export { toast }

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  warning: (msg: string) => toast.warning(msg),
  info: (msg: string) => toast.info(msg),
}
