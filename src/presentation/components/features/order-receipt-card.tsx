'use client'

import { useState } from 'react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import { Receipt } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { api } from '@/infrastructure/api/client'
import type { TranslationKey } from '@/infrastructure/i18n'
import { formatPrice } from '@/shared/lib/format'
import { formatDate } from '@/shared/lib/format-date'
import { toast } from '@/presentation/components/ui/toast'
import { captureLoadError } from '@/shared/lib/load-error'

const PROVIDER_KEYS: Record<string, TranslationKey> = {
  wallet: 'receipt_provider_wallet',
  sandbox: 'receipt_provider_sandbox',
}

export function OrderReceiptCard({ orderId }: { orderId: string }) {
  const { t, language } = useApp()
  const [downloading, setDownloading] = useState(false)

  const { data: receipt, loading } = useProtectedLoader(
    () => api.getOrderReceipt(orderId).catch(() => null),
    [orderId]
  )
  const missing = !loading && !receipt

  const providerLabel = (provider: string) => {
    const key = PROVIDER_KEYS[provider]
    return key ? t(key) : provider
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const blob = await api.downloadOrderReceiptPdf(orderId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receipt?.receipt_number ?? orderId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(captureLoadError(e, { scope: 'orders' }, t))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4">
        <div className="h-16 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      </div>
    )
  }

  if (missing || !receipt) {
    return (
      <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4">
        <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('receipt_not_found')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
        <p className="text-[13px] font-bold text-[var(--ishbor-text)]">{t('receipt_title')}</p>
      </div>
      <dl className="space-y-2 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--ishbor-text-muted)]">{t('receipt_number_label')}</dt>
          <dd className="font-medium">{receipt.receipt_number}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--ishbor-text-muted)]">{t('receipt_amount_label')}</dt>
          <dd className="font-semibold">{formatPrice(receipt.amount)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--ishbor-text-muted)]">{t('receipt_provider_label')}</dt>
          <dd>{providerLabel(receipt.provider)}</dd>
        </div>
        {receipt.created_at && (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--ishbor-text-muted)]">{t('receipt_date_label')}</dt>
            <dd>{formatDate(receipt.created_at, language)}</dd>
          </div>
        )}
      </dl>
      <Button
        variant="outline"
        fullWidth
        className="mt-4"
        loading={downloading}
        onClick={() => void downloadPdf()}
      >
        {t('receipt_download')}
      </Button>
    </div>
  )
}
