'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export function HeaderWalletPill({
  balance,
  compact,
  className,
}: {
  balance?: number
  compact?: boolean
  className?: string
}) {
  const { t, profile, refreshProfile } = useApp()
  const pathname = usePathname()
  const displayBalance = balance ?? profile?.wallet_balance ?? 0

  useEffect(() => {
    if (pathname?.includes('/wallet')) {
      void refreshProfile()
    }
  }, [pathname, refreshProfile])

  return (
    <Link
      href={PATHS.dashboardWallet}
      className={cn(
        compact ? 'header-wallet-pill header-wallet-pill--compact' : 'header-wallet-pill hide-mobile',
        className
      )}
      title={t('nav_wallet')}
    >
      <span className="header-wallet-pill-icon" aria-hidden>
        <Wallet className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="header-wallet-pill-amount">{formatPrice(displayBalance)}</span>
    </Link>
  )
}
