'use client'

import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function AuthRoleCard({
  selected,
  icon,
  iconBg,
  title,
  subtitle,
  bullets,
  onSelect,
}: {
  selected: boolean
  icon: React.ReactNode
  iconBg?: string
  title: string
  subtitle: string
  bullets?: string[]
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('auth-role-card', selected && 'auth-role-card--selected')}
      aria-pressed={selected}
    >
      {selected && (
        <span className="auth-role-card__check" aria-hidden>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className="auth-role-card__icon"
        style={{ backgroundColor: iconBg ?? 'var(--color-primary-light)' }}
      >
        {icon}
      </div>
      <h3 className="auth-role-card__title">{title}</h3>
      <p className="auth-role-card__subtitle">{subtitle}</p>
      {bullets && bullets.length > 0 && (
        <ul className="auth-role-card__bullets">
          {bullets.map((b) => (
            <li key={b}>
              <span className="auth-role-card__bullet-dot" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      )}
    </button>
  )
}
