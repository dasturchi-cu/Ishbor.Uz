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
    <div className="ps-modal-backdrop z-[100]">
      <div className="ps-modal max-w-md">
        <h3 className="text-[16px] font-bold text-[var(--ishbor-text)]">{title}</h3>
        {description && <p className="mt-2 text-[14px] text-[var(--ishbor-text-muted)]">{description}</p>}
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
