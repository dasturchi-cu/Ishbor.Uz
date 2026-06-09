'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { avatarColorFromName, initialsFromName } from '@/shared/lib/avatar'

const SIZE_MAP = {
  24: 'h-6 w-6 text-[10px]',
  28: 'h-7 w-7 text-[10px]',
  32: 'h-8 w-8 text-xs',
  36: 'h-9 w-9 text-xs',
  40: 'h-10 w-10 text-sm',
  48: 'h-12 w-12 text-sm',
  56: 'h-14 w-14 text-base',
  64: 'h-16 w-16 text-lg',
  80: 'h-20 w-20 text-xl',
  96: 'h-24 w-24 text-2xl',
  120: 'h-[120px] w-[120px] text-3xl',
} as const

export type AvatarSize = keyof typeof SIZE_MAP

export interface AvatarProps {
  name: string
  src?: string | null
  size?: AvatarSize
  status?: 'online' | 'away' | 'offline'
  pro?: boolean
  verified?: boolean
  className?: string
}

export function Avatar({ name, src, size = 40, status, pro, verified, className }: AvatarProps) {
  const initials = initialsFromName(name)
  const dotSize = size >= 64 ? 'h-2.5 w-2.5 border-2' : 'h-2 w-2 border'
  const [displaySrc, setDisplaySrc] = useState(src ?? null)

  useEffect(() => {
    if (src) setDisplaySrc(src)
  }, [src])

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={name}
          className={cn('rounded-full object-cover ring-2 ring-[var(--color-bg)]', SIZE_MAP[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-[var(--color-bg)]',
            SIZE_MAP[size]
          )}
          style={{ backgroundColor: avatarColorFromName(name) }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-[var(--color-bg)]',
            dotSize,
            status === 'online' && 'bg-[var(--success)]',
            status === 'away' && 'bg-[var(--warning)]',
            status === 'offline' && 'bg-[var(--neutral-400)]'
          )}
          aria-hidden
        />
      )}
      {verified && (
        <span
          className={cn(
            'absolute z-10 flex items-center justify-center rounded-full border-2 border-[var(--neutral-0)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-xs)]',
            size >= 64 ? 'bottom-0 right-0 h-5 w-5 text-[10px]' : 'bottom-0 right-0 h-4 w-4 text-[8px]'
          )}
          title="Verified"
          aria-label="Verified"
        >
          ✓
        </span>
      )}
      {pro && !verified && (
        <span
          className={cn(
            'absolute z-10 rounded-[var(--r-full)] border border-[var(--neutral-0)] bg-[var(--success-bg)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[var(--success-dark)] shadow-[var(--shadow-xs)]',
            status ? '-top-0.5 left-1/2 -translate-x-1/2' : 'bottom-0 right-0 translate-x-1/4 translate-y-1/4'
          )}
        >
          Pro
        </span>
      )}
    </div>
  )
}
