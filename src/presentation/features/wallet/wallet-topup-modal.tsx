'use client'



import { useState } from 'react'

import { useApp } from '@/application/providers/app-provider'

import { Button } from '@/presentation/components/ui/button'

import { Input } from '@/presentation/components/ui/input'

import { api } from '@/infrastructure/api/client'

import { toast } from '@/presentation/components/ui/toast'

import { captureActionError } from '@/shared/lib/action-error'

import { isAllowedPaymentRedirectUrl } from '@/shared/lib/safe-url'
import {

  isWalletTopupComplete,

  isWalletTopupFailed,

  isWalletTopupPending,

  pollWalletTopupUntilDone,

} from '@/shared/lib/wallet-topup-poll'

import { X } from 'lucide-react'



const PRESETS = [50_000, 100_000, 250_000, 500_000]



interface WalletTopupModalProps {

  open: boolean

  onClose: () => void

  onSuccess: () => void

}



export function WalletTopupModal({ open, onClose, onSuccess }: WalletTopupModalProps) {

  const { t } = useApp()

  const [amount, setAmount] = useState('100000')

  const [loading, setLoading] = useState(false)



  if (!open) return null



  const handleTopup = async () => {

    const parsed = Number(amount.replace(/\s/g, ''))

    if (!parsed || parsed < 10_000) {

      toast.error(t('wallet_topup_min'))

      return

    }

    setLoading(true)

    try {

      const intent = await api.walletTopup(parsed, 'sandbox')



      if (intent.redirect_url) {
        if (!isAllowedPaymentRedirectUrl(intent.redirect_url)) {
          toast.error(t('error_payment_redirect'))
          return
        }
        window.location.href = intent.redirect_url
        return
      }



      let final = intent

      if (isWalletTopupPending(intent.status)) {

        toast.info(t('wallet_topup_polling'))

        final = await pollWalletTopupUntilDone(intent.id)

      }



      if (isWalletTopupFailed(final.status)) {

        toast.error(t('wallet_topup_failed'))

        return

      }



      if (!isWalletTopupComplete(final.status)) {

        toast.error(t('wallet_topup_poll_timeout'))

        return

      }



      toast.success(t('wallet_topup_success'))

      onSuccess()

      onClose()

    } catch (e) {

      const msg = e instanceof Error ? e.message : ''

      if (msg === 'wallet_topup_poll_timeout') {

        toast.error(t('wallet_topup_poll_timeout'))

      } else {

        toast.error(captureActionError(e, { scope: 'wallet_topup' }, t))

      }

    } finally {

      setLoading(false)

    }

  }



  return (

    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">

      <div

        role="dialog"

        aria-modal="true"

        className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5 shadow-lg"

      >

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-[18px] font-bold text-[var(--kwork-text)]">{t('wallet_topup_title')}</h2>

          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--neutral-50)]" aria-label={t('close')}>

            <X className="h-5 w-5" />

          </button>

        </div>

        <p className="mb-4 text-[13px] text-[var(--kwork-text-muted)]">{t('wallet_topup_desc')}</p>

        <p className="mb-3 text-[12px] text-[var(--kwork-text-muted)]">{t('payment_sandbox_note')}</p>

        <Input

          value={amount}

          onChange={(e) => setAmount(e.target.value)}

          label={t('wallet_topup_amount')}

          inputMode="numeric"

        />

        <div className="mt-3 flex flex-wrap gap-2">

          {PRESETS.map((p) => (

            <button

              key={p}

              type="button"

              onClick={() => setAmount(String(p))}

              className="rounded-full border border-[var(--kwork-border)] px-3 py-1 text-[12px] font-medium hover:border-[var(--color-primary)]"

            >

              {(p / 1000).toFixed(0)}k

            </button>

          ))}

        </div>

        <Button variant="primary" className="mt-5 w-full" loading={loading} onClick={() => void handleTopup()}>

          {t('payment_sandbox_pay')}

        </Button>

      </div>

    </div>

  )

}

