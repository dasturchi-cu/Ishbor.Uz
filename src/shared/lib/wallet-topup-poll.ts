import { api } from '@/infrastructure/api/client'

export type WalletTopupStatus = {
  id: string
  amount: number
  provider: string
  status: string
  redirect_url?: string | null
}

const PENDING = new Set(['pending', 'processing'])

export function isWalletTopupComplete(status: string): boolean {
  return status === 'succeeded' || status === 'completed'
}

export function isWalletTopupFailed(status: string): boolean {
  return status === 'failed' || status === 'cancelled'
}

export function isWalletTopupPending(status: string): boolean {
  return PENDING.has(status)
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isWalletTopupIntentId(value: string): boolean {
  return UUID_RE.test(value)
}

/** Pending intent tugaguncha poll qiladi (Click/Payme qaytishida) */
export async function pollWalletTopupUntilDone(
  intentId: string,
  options?: { intervalMs?: number; maxAttempts?: number }
): Promise<WalletTopupStatus> {
  const intervalMs = options?.intervalMs ?? 2000
  const maxAttempts = options?.maxAttempts ?? 20

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await api.getWalletTopup(intentId)
    if (isWalletTopupComplete(res.status) || isWalletTopupFailed(res.status)) {
      return res
    }
    if (!isWalletTopupPending(res.status)) {
      return res
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }

  throw new Error('wallet_topup_poll_timeout')
}
