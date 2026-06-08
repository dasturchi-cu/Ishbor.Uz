'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, HelpCircle, LogOut, Settings, Shield, User } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Avatar } from '@/presentation/components/ui/avatar'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/presentation/components/ui/toast'

const NAV_ITEMS = [
  { href: PATHS.dashboardProfile, labelKey: 'nav_profile' as const, icon: User },
  { href: PATHS.dashboardSettings, labelKey: 'nav_settings' as const, icon: Settings },
  { href: PATHS.help, labelKey: 'nav_help_center' as const, icon: HelpCircle },
]

export function AvatarDropdown({ size = 32 }: { size?: 24 | 28 | 32 | 36 | 40 | 48 | 56 }) {
  const { t, profile, currentUserRole, setCurrentUserRole, signOut } = useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = profile?.full_name ?? t('nav_profile')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    router.push(PATHS.home)
  }

  const switchRole = (role: 'freelancer' | 'client') => {
    if (role === currentUserRole) return
    setCurrentUserRole(role)
    toast.success(
      role === 'client' ? t('role_switched_client') : t('role_switched_freelancer')
    )
    router.push(dashboardPathForRole(role))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('avatar-dropdown-trigger', open && 'avatar-dropdown-trigger--open')}
        aria-expanded={open}
        aria-label={t('nav_profile')}
      >
        <Avatar name={name} src={profile?.avatar_url} size={size} className="[&>div]:!ring-0 [&>img]:!ring-0" />
        <ChevronDown
          className={cn('header-control-pill-chevron avatar-dropdown-chevron', open && 'header-control-pill-chevron--open')}
          strokeWidth={2.25}
        />
      </button>

      {open && (
        <div className="avatar-dropdown-menu">
          <div className="avatar-dropdown-head">
            <p className="avatar-dropdown-name">{name}</p>
            {profile?.email && <p className="avatar-dropdown-email">{profile.email}</p>}
          </div>

          <div className="avatar-dropdown-role">
            <button
              type="button"
              onClick={() => switchRole('client')}
              className={cn(
                'avatar-dropdown-role-btn',
                currentUserRole === 'client' && 'avatar-dropdown-role-btn--active'
              )}
            >
              {t('role_client_label')}
            </button>
            <button
              type="button"
              onClick={() => switchRole('freelancer')}
              className={cn(
                'avatar-dropdown-role-btn',
                currentUserRole === 'freelancer' && 'avatar-dropdown-role-btn--active'
              )}
            >
              {t('role_freelancer_label')}
            </button>
          </div>

          <nav className="avatar-dropdown-nav">
            {profile?.is_admin && (
              <Link
                href={PATHS.admin}
                onClick={() => setOpen(false)}
                className="avatar-dropdown-item"
              >
                <Shield className="avatar-dropdown-item-icon" strokeWidth={2} />
                <span className="avatar-dropdown-item-label">{t('admin_panel')}</span>
              </Link>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="avatar-dropdown-item"
                >
                  <Icon className="avatar-dropdown-item-icon" strokeWidth={2} />
                  <span className="avatar-dropdown-item-label">{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </nav>

          <div className="avatar-dropdown-footer">
            <button type="button" onClick={handleLogout} className="avatar-dropdown-item avatar-dropdown-item--logout">
              <LogOut className="avatar-dropdown-item-icon" strokeWidth={2} />
              <span className="avatar-dropdown-item-label">{t('nav_logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
