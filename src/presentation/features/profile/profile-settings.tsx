'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, CreditCard, Globe, HelpCircle, Monitor, Plus, Shield, Trash2, User, UserCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { POPULAR_SKILLS } from '@/domain/constants/skills'
import { api } from '@/infrastructure/api/client'
import { dashboardPathForRole, freelancerPath, PATHS } from '@/domain/constants/routes'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { updatePassword } from '@/infrastructure/auth/password'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { toast } from '@/presentation/components/ui/toast'
import { loadNotificationPrefs, saveNotificationPrefs } from '@/shared/lib/notification-prefs'
import { profileUpdateSchema } from '@/domain/validators/profile'
import { ReferralBanner } from '@/presentation/components/layout/referral-banner'
import { AiSuggestButton } from '@/presentation/components/ui/ai-suggest-button'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useEscapeClose } from '@/shared/lib/use-escape-close'

type SettingsTab =
  | 'general'
  | 'profile'
  | 'appearance'
  | 'security'
  | 'withdrawal'
  | 'notifications'
  | 'account'

const TABS: { id: SettingsTab; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { id: 'general', labelKey: 'settings_tab_general', icon: User },
  { id: 'profile', labelKey: 'settings_tab_profile', icon: UserCircle },
  { id: 'appearance', labelKey: 'settings_tab_appearance', icon: Monitor },
  { id: 'security', labelKey: 'tab_security', icon: Shield },
  { id: 'withdrawal', labelKey: 'settings_tab_withdrawal', icon: CreditCard },
  { id: 'notifications', labelKey: 'tab_notifications', icon: Bell },
  { id: 'account', labelKey: 'settings_tab_account', icon: Trash2 },
]

const TIMEZONES = [
  '(UTC +05:00) Toshkent',
  '(UTC +03:00) Moskva, Minsk',
  '(UTC +00:00) London',
  '(UTC +04:00) Dubay',
]

function hintText(
  t: (key: TranslationKey) => string,
  key: TranslationKey,
  n: number,
  max: number,
  min: number
) {
  return t(key).replace('{n}', String(n)).replace('{max}', String(max)).replace('{min}', String(min))
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className={cn('settings-toggle-row', disabled && 'opacity-60')}>
      <div className="min-w-0">
        <span className="settings-toggle-label">{label}</span>
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--kwork-text-muted)]">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn('settings-switch', checked ? 'settings-switch--on' : 'settings-switch--off')}
      >
        <span className="settings-switch-knob" />
      </button>
    </div>
  )
}

function SettingsNav({
  activeTab,
  onSelect,
  t,
}: {
  activeTab: SettingsTab
  onSelect: (tab: SettingsTab) => void
  t: (key: TranslationKey) => string
}) {
  return (
    <>
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={cn('settings-tab', activeTab === tab.id && 'settings-tab-active')}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <nav className="settings-nav" aria-label={t('settings')}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn('settings-nav-item', activeTab === tab.id && 'settings-nav-item--active')}
            >
              <Icon className="settings-nav-icon" />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export function ProfileSettings() {
  const { t, profile, refreshProfile, userId, currentUserRole, language, setLanguage, theme, setTheme } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const inDashboard = pathname.startsWith('/dashboard')
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [timezone, setTimezone] = useState(TIMEZONES[0])
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [browserNotif, setBrowserNotif] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [portfolioUrls, setPortfolioUrls] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteDialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(deleteOpen, deleteDialogRef)
  useEscapeClose(deleteOpen, () => setDeleteOpen(false))
  const [simpleNotif, setSimpleNotif] = useState({
    emailNewOrders: true,
    emailPromotions: false,
    smsUrgent: true,
    telegramConnect: false,
    chatMuted: false,
  })

  useEffect(() => {
    api
      .getNotificationPrefs()
      .then(setSimpleNotif)
      .catch(() => setSimpleNotif(loadNotificationPrefs()))
  }, [])

  const updateNotifPref = <K extends keyof typeof simpleNotif>(key: K, value: boolean) => {
    setSimpleNotif((prev) => {
      const next = { ...prev, [key]: value }
      saveNotificationPrefs(next)
      api.updateNotificationPrefs({ [key]: value }).catch(() => undefined)
      toast.success(t('save_success'))
      return next
    })
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: UZ_REGIONS[0] as string,
    phone: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name ?? '',
        email: profile.email ?? '',
        city: profile.region ?? UZ_REGIONS[0],
        phone: profile.phone ?? '',
      })
      setBio(profile.bio ?? '')
      setTitle(profile.specialty ?? '')
      setUsername(profile.username ?? ((profile.full_name ?? '').toLowerCase().replace(/\s+/g, '') || ''))
      setSkills(profile.skills ?? [])
      setPortfolioUrls((profile.portfolio_urls ?? []).join(', '))
    }
  }, [profile])

  const addSkill = (raw: string) => {
    const s = raw.trim()
    if (!s || skills.length >= 12 || skills.includes(s)) return
    setSkills((prev) => [...prev, s])
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((x) => x !== skill))
  }

  useEffect(() => {
    const slug = username.trim().replace(/^@/, '')
    if (slug.length < 3) {
      setUsernameStatus('idle')
      return
    }
    if (profile?.username === slug) {
      setUsernameStatus('ok')
      return
    }
    setUsernameStatus('checking')
    const id = setTimeout(() => {
      api
        .checkUsername(slug)
        .then((r) => setUsernameStatus(r.available ? 'ok' : 'taken'))
        .catch(() => setUsernameStatus('idle'))
    }, 400)
    return () => clearTimeout(id)
  }, [username, profile?.username])

  const profileLink =
    userId && typeof window !== 'undefined'
      ? `${window.location.origin}${freelancerPath(userId)}`
      : userId
        ? freelancerPath(userId)
        : PATHS.services

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error(t('error_password_short'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('error_password_mismatch'))
      return
    }
    if (!isSupabaseConfigured()) return
    setPasswordSaving(true)
    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('password_updated_success'))
    } catch (e) {
      toast.error(e instanceof Error ? mapAuthErrorMessage(e.message, t) : t('error_required'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleBrowserNotifToggle = async (enabled: boolean) => {
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        toast.info(t('notifications_permission_denied'))
        return
      }
    }
    setBrowserNotif(enabled)
  }

  const handleSave = async () => {
    setMessage('')
    if (usernameStatus === 'checking') {
      setMessage(t('username_checking'))
      return
    }
    if (usernameStatus === 'taken') {
      setMessage(t('username_taken'))
      return
    }
    const parsed = profileUpdateSchema.safeParse({
      full_name: formData.name,
      username: username.trim() || undefined,
      bio,
      region: formData.city,
      phone: formData.phone,
      specialty: title,
    })
    if (!parsed.success) {
      setMessage(t('profile_save_validation_error'))
      return
    }
    setSaving(true)
    try {
      await api.updateProfile({
        full_name: formData.name,
        username: username.trim() || undefined,
        bio,
        region: formData.city,
        phone: formData.phone,
        specialty: title,
        skills: currentUserRole === 'freelancer' ? skills : undefined,
        portfolio_urls:
          currentUserRole === 'freelancer'
            ? portfolioUrls
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean)
            : undefined,
      })
      await refreshProfile()
      setMessage(t('save_success'))
      toast.success(t('save_success'))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setSaving(false)
    }
  }

  const dashboardHref = dashboardPathForRole(currentUserRole)

  return (
    <div className="settings-layout">
      {!inDashboard && (
        <div className="settings-page-header">
          <Breadcrumb
            className="mb-3"
            items={[
              { label: t('home'), href: PATHS.home },
              { label: t('nav_dashboard'), href: dashboardHref },
              { label: t('settings') },
            ]}
          />
          <h1 className="settings-page-title">{t('settings')}</h1>
          <p className="settings-page-desc">{t('settings_desc')}</p>
        </div>
      )}

      <div className="settings-shell">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h2 className="settings-page-title">{t('settings')}</h2>
            <p className="settings-page-desc">{t('settings_desc')}</p>
          </div>
          <SettingsNav activeTab={activeTab} onSelect={setActiveTab} t={t} />
        </aside>

        <div className="settings-main">
          {message && (
            <Alert variant="success" className="mb-4">
              {message}
            </Alert>
          )}

          <div className="settings-panel">
            {activeTab === 'general' && (
              <>
                <p className="text-[13px] leading-relaxed text-[var(--kwork-text)]">
                  {t('settings_profile_link')}{' '}
                  <Link href={profileLink} className="font-medium text-[var(--color-primary)] hover:underline">
                    {profileLink}
                  </Link>
                </p>

                <div className="settings-divider" />

                <div className="settings-form-stack mt-5">
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('username')}</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="catalog-control !h-[42px]"
                    />
                    {usernameStatus === 'checking' && (
                      <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{t('username_checking')}</p>
                    )}
                    {usernameStatus === 'ok' && (
                      <p className="mt-1 text-[12px] text-[var(--success-dark)]">{t('username_available')}</p>
                    )}
                    {usernameStatus === 'taken' && (
                      <p className="mt-1 text-[12px] text-[var(--error)]">{t('username_taken')}</p>
                    )}
                  </div>
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('email')}</label>
                    <Input
                      type="email"
                      value={formData.email}
                      disabled
                      className="catalog-control !h-[42px] opacity-70"
                    />
                  </div>
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_timezone')}</label>
                    <Select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                      className="catalog-control"
                    />
                  </div>
                </div>

                <div className="settings-footer">
                  <Button variant="primary" onClick={handleSave} loading={saving}>
                    {t('settings_save')}
                  </Button>
                  <button
                    type="button"
                    className="settings-link-action inline-flex items-center gap-1"
                    onClick={() => setActiveTab('profile')}
                  >
                    {t('settings_link_phone')}
                    <HelpCircle className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="settings-form-stack">
                  <div>
                    <p className="settings-field-label inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      {t('settings_tab_language')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['uz', 'ru', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={cn(
                            'rounded-[var(--r-full)] border px-4 py-2 text-[13px] font-medium transition',
                            language === lang
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                              : 'border-[var(--color-border)] text-[var(--color-text-sub)] hover:border-[var(--color-border-strong)]'
                          )}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-divider" />

                  <div>
                    <p className="settings-field-label">{t('settings_header_theme')}</p>
                    <div className="mt-2 flex gap-6">
                      {(['light', 'dark'] as const).map((value) => (
                        <label key={value} className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input
                            type="radio"
                            name="header-theme"
                            checked={theme === value}
                            onChange={() => setTheme(value)}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                          />
                          {t(value === 'light' ? 'settings_theme_light' : 'settings_theme_dark')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-footer !justify-start">
                  <Button variant="primary" onClick={() => toast.success(t('save_success'))}>
                    {t('settings_save')}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <div className="settings-form-stack">
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_your_name')}</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="catalog-control !h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="settings-field-label">{t('nav_profile')}</label>
                    <FileUploadZone
                      circular
                      maxFiles={1}
                      maxSizeMb={2}
                      initialUrls={profile?.avatar_url ? [profile.avatar_url] : []}
                      disabled={avatarUploading || !userId}
                      onUpload={async (files) => {
                        if (!userId || !files[0] || !isSupabaseConfigured()) return []
                        setAvatarUploading(true)
                        setMessage('')
                        try {
                          const url = await uploadAvatar(files[0], userId)
                          await api.updateProfile({ avatar_url: url })
                          await refreshProfile()
                          setMessage(t('save_success'))
                          return [url]
                        } catch (e) {
                          setMessage(e instanceof Error ? e.message : t('error_required'))
                          return []
                        } finally {
                          setAvatarUploading(false)
                        }
                      }}
                    />
                  </div>

                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_what_you_do')}</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="catalog-control !h-[42px]"
                    />
                    <p className="mt-1 text-[11px] text-[var(--kwork-text-muted)]">
                      {hintText(t, 'settings_chars_hint', title.length, 50, 5)}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 max-w-[520px]">
                      <label className="settings-field-label">{t('settings_about_you')}</label>
                      <AiSuggestButton
                        kind="profile_bio"
                        context={{
                          specialty: title,
                          skills,
                          region: formData.city,
                        }}
                        onApply={setBio}
                      />
                    </div>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t('settings_about_placeholder')}
                      rows={5}
                      className="max-w-[520px]"
                    />
                    <p className="mt-1 text-[11px] text-[var(--kwork-text-muted)]">
                      {hintText(t, 'settings_chars_hint', bio.length, 1200, 200)}
                    </p>
                  </div>

                  <div>
                    <label className="settings-field-label">
                      {t('settings_skills_header').replace('{n}', String(skills.length)).replace('{max}', '12')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--kwork-border)] bg-[var(--neutral-50)] px-2.5 py-1 text-[12px]"
                        >
                          {skill}
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                    {skills.length < 12 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSkill(skillInput)
                            }
                          }}
                          placeholder={t('settings_add_skill')}
                          className="max-w-[220px]"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => addSkill(skillInput)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {POPULAR_SKILLS.slice(0, 6).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="rounded-full border border-dashed border-[var(--kwork-border)] px-2 py-0.5 text-[11px] text-[var(--kwork-text-muted)] hover:border-[var(--color-primary)]"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentUserRole === 'freelancer' && (
                    <div>
                      <label className="settings-field-label">{t('portfolio_urls_label')}</label>
                      <Textarea
                        value={portfolioUrls}
                        onChange={(e) => setPortfolioUrls(e.target.value)}
                        rows={3}
                        placeholder={t('settings_url_placeholder')}
                      />
                    </div>
                  )}

                  <div>
                    <label className="settings-field-label inline-flex items-center gap-1">
                      {t('settings_business_hours')}
                      <HelpCircle className="h-3.5 w-3.5 text-[var(--kwork-text-muted)]" />
                    </label>
                    <p className="text-[13px] text-[var(--kwork-text-muted)]">
                      {t('settings_business_hours_hint')
                        .replace('{from}', '09:00')
                        .replace('{to}', '18:00')}
                    </p>
                  </div>

                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_country')}</label>
                    <Select
                      value={formData.city}
                      onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                      options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
                      className="catalog-control"
                    />
                  </div>

                  <div>
                    <label className="settings-field-label">{t('settings_profile_banner')}</label>
                    <div className="max-w-[520px] h-28 overflow-hidden rounded-lg border border-[var(--kwork-border)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)]" />
                    <button type="button" className="settings-link-action mt-2">
                      {t('settings_upload')}
                    </button>
                  </div>
                </div>

                <div className="settings-footer">
                  <Button variant="primary" onClick={handleSave} loading={saving}>
                    {t('settings_save')}
                  </Button>
                  {userId && (
                    <Link href={freelancerPath(userId)} className="settings-link-action">
                      {t('view_profile')} →
                    </Link>
                  )}
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('change_password')}</h2>
                  <p className="settings-section-note">{t('security_supabase_note')}</p>
                  <div className="settings-form-stack mt-4">
                    <div className="grid gap-4 sm:max-w-[420px] sm:grid-cols-2">
                      <div>
                        <label className="settings-field-label">{t('new_password')}</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('password_placeholder')}
                          className="catalog-control !h-[42px]"
                        />
                      </div>
                      <div>
                        <label className="settings-field-label">{t('confirm_password')}</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('password_placeholder')}
                          className="catalog-control !h-[42px]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Button variant="primary" size="sm" loading={passwordSaving} onClick={handlePasswordUpdate}>
                      {t('update_password')}
                    </Button>
                  </div>
                </div>

                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('two_factor')}</h2>
                  <p className="settings-section-note">{t('two_factor_desc')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => toast.info(t('two_factor_soon'))}
                  >
                    {t('enable_2fa')}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'withdrawal' && (
              <>
                <div className="rounded-lg border border-[var(--kwork-border)] bg-[var(--neutral-50)] p-5">
                  <h2 className="settings-section-title">
                    {t('settings_verify_phone_title')}
                  </h2>
                  <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">
                    {t('settings_verify_phone_desc')}
                  </p>
                  <Button variant="primary" size="sm" className="mt-4">
                    {t('settings_verify_now')}
                  </Button>
                </div>

                <div className="settings-form-stack mt-5">
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_webmoney')}</label>
                    <Input
                      disabled
                      placeholder={t('settings_verify_required')}
                      className="catalog-control !h-[42px] bg-[var(--neutral-50)]"
                    />
                  </div>
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('settings_card')}</label>
                    <p className="mb-2 text-[12px] text-[var(--kwork-text-muted)]">{t('settings_card_desc')}</p>
                    <Input
                      disabled
                      placeholder={t('settings_verify_required')}
                      className="catalog-control !h-[42px] bg-[var(--neutral-50)]"
                    />
                  </div>
                </div>

                <div className="settings-footer !justify-start">
                  <Button variant="primary" disabled className="opacity-50">
                    {t('settings_save')}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'account' && (
              <>
                <ReferralBanner className="mb-5" />
                <div className="settings-delete-card">
                  <h2 className="settings-delete-card__title">
                    {t('delete_account_section')}
                  </h2>
                  <p className="settings-delete-card__desc">
                    {t('delete_account_warning')}
                  </p>
                  <Button
                    variant="danger"
                    size="md"
                    className="settings-delete-card__btn"
                    onClick={() => setDeleteOpen(true)}
                  >
                    {t('delete_account_btn')}
                  </Button>
                </div>
                {deleteOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteOpen(false)}>
                    <div
                      ref={deleteDialogRef}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="delete-account-title"
                      className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 id="delete-account-title" className="text-[16px] font-bold text-[var(--error-dark)]">{t('delete_account_confirm')}</h3>
                      <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">{t('delete_account_confirm_hint')}</p>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleting}
                          onClick={async () => {
                            setDeleting(true)
                            try {
                              await api.deleteAccount()
                              const { getSupabase } = await import('@/infrastructure/supabase/client')
                              await getSupabase().auth.signOut()
                              router.push(PATHS.home)
                            } catch {
                              toast.error(t('error_required'))
                              setDeleting(false)
                            }
                          }}
                        >
                          {t('delete_account_btn')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="settings-notif-card">
                  <h3 className="settings-notif-card-title">{t('email_notifications')}</h3>
                  <ToggleRow
                    label={t('new_orders')}
                    checked={simpleNotif.emailNewOrders}
                    onChange={(v) => updateNotifPref('emailNewOrders', v)}
                    hint={t('notif_email_hint')}
                  />
                  <ToggleRow
                    label={t('promotions')}
                    checked={simpleNotif.emailPromotions}
                    onChange={(v) => updateNotifPref('emailPromotions', v)}
                  />
                </div>

                <div className="settings-notif-card">
                  <h3 className="settings-notif-card-title">{t('sms_notifications')}</h3>
                  <ToggleRow
                    label={t('urgent_messages')}
                    checked={simpleNotif.smsUrgent}
                    onChange={(v) => updateNotifPref('smsUrgent', v)}
                    hint={!formData.phone?.trim() ? t('notif_sms_needs_phone') : t('notif_sms_hint')}
                  />
                </div>

                <div className="settings-notif-card">
                  <h3 className="settings-notif-card-title">{t('telegram_notifications')}</h3>
                  <ToggleRow
                    label={t('connect_telegram')}
                    checked={false}
                    disabled
                    hint={t('notif_integration_soon')}
                    onChange={() => undefined}
                  />
                </div>

                <div className="settings-divider" />

                <h2 className="settings-section-title">{t('settings_browser_notifications')}</h2>
                <p className="settings-section-note">{t('settings_browser_notifications_desc')}</p>
                <div className="mt-3">
                  <ToggleRow
                    label={t('settings_browser_toggle')}
                    checked={browserNotif}
                    onChange={handleBrowserNotifToggle}
                  />
                </div>

                <div className="settings-footer !justify-start">
                  <Button variant="primary">{t('settings_save')}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
