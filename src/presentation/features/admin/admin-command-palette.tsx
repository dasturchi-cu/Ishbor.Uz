'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'

type CommandItem = {
  id: string
  labelKey: TranslationKey
  href?: string
  action?: () => void
  keywords?: string[]
}

export function AdminCommandPalette({
  open,
  onClose,
  onRefresh,
}: {
  open: boolean
  onClose: () => void
  onRefresh?: () => void
}) {
  const { t } = useApp()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const items: CommandItem[] = useMemo(
    () => [
      { id: 'dashboard', labelKey: 'admin_nav_dashboard', href: PATHS.admin },
      { id: 'users', labelKey: 'admin_nav_users', href: PATHS.adminUsers, keywords: ['user', 'foydalanuvchi'] },
      { id: 'disputes', labelKey: 'admin_nav_disputes', href: PATHS.adminDisputes },
      { id: 'escrow', labelKey: 'admin_nav_escrow', href: PATHS.adminEscrow },
      { id: 'finance', labelKey: 'admin_nav_finance', href: PATHS.adminFinance },
      { id: 'moderation', labelKey: 'admin_nav_moderation', href: PATHS.adminModeration },
      { id: 'broadcast', labelKey: 'admin_nav_broadcast', href: PATHS.adminBroadcast },
      { id: 'companies', labelKey: 'admin_nav_companies', href: PATHS.adminCompanies },
      { id: 'flags', labelKey: 'admin_nav_feature_flags', href: PATHS.adminFeatureFlags },
      { id: 'backups', labelKey: 'admin_nav_backups', href: PATHS.adminBackups },
      { id: 'services', labelKey: 'admin_nav_services', href: PATHS.adminServices },
      { id: 'orders', labelKey: 'admin_nav_orders', href: PATHS.adminOrders },
      {
        id: 'refresh',
        labelKey: 'admin_refresh',
        action: () => onRefresh?.(),
        keywords: ['reload', 'yangilash'],
      },
    ],
    [onRefresh]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const label = t(item.labelKey).toLowerCase()
      return label.includes(q) || item.keywords?.some((word) => word.includes(q))
    })
  }, [items, query, t])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((idx) => Math.min(idx + 1, Math.max(filtered.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((idx) => Math.max(idx - 1, 0))
      }
      if (event.key === 'Enter' && filtered[activeIndex]) {
        event.preventDefault()
        const item = filtered[activeIndex]
        if (item.href) router.push(item.href)
        else item.action?.()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, filtered, activeIndex, onClose, router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <button type="button" className="absolute inset-0" aria-label={t('close')} onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
          <Search className="size-4 text-[var(--admin-muted)]" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin_cmd_placeholder')}
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none"
            aria-label={t('admin_cmd_placeholder')}
          />
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[var(--admin-muted)]">{t('admin_cmd_empty')}</li>
          )}
          {filtered.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  index === activeIndex
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'text-[var(--admin-text)] hover:bg-[var(--admin-bg)]'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  if (item.href) router.push(item.href)
                  else item.action?.()
                  onClose()
                }}
              >
                {t(item.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function useAdminCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
