'use client'

import { Button } from '@/presentation/components/ui/button'
import { useApp } from '@/application/providers/app-provider'

export interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useApp()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-6 shadow-[var(--shadow-lg)]">
        <h3 className="text-[16px] font-bold text-[var(--kwork-text)]">{title}</h3>
        {description && <p className="mt-2 text-[14px] text-[var(--kwork-text-muted)]">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button
            variant={danger ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
