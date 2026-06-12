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
import type { ApiVerification } from '@/infrastructure/api/types'
import { dashboardPathForRole, freelancerPath, PATHS } from '@/domain/constants/routes'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { uploadAvatar, uploadPortfolioImage } from '@/infrastructure/supabase/storage'
import { checkUsernameRemote } from '@/shared/lib/check-username-remote'
import { normalizeUsername, prepareUsernameForSubmit, USERNAME_MAX_LENGTH } from '@/shared/lib/username'
import { persistProfilePatch } from '@/shared/lib/persist-profile-patch'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { updatePassword } from '@/infrastructure/auth/password'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { toast } from '@/presentation/components/ui/toast'
import {
  browserNotificationsEnabled,
  loadNotificationPrefs,
  saveNotificationPrefs,
  setBrowserNotificationsEnabled,
} from '@/shared/lib/notification-prefs'
import { profileUpdateSchema } from '@/domain/validators/profile'
import { AiSuggestButton } from '@/presentation/components/ui/ai-suggest-button'
import { NotificationChannelStatus } from '@/presentation/components/layout/notification-channel-status'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { CompanyStirSection } from '@/presentation/components/features/company-stir-section'
import { CompanySelfServiceSection } from '@/presentation/components/features/company-self-service-section'
import { TotpSettingsSection } from '@/presentation/components/auth/totp-settings-section'
import { PhoneVerifySection } from '@/presentation/components/auth/phone-verify-section'
import { EmailChangeSection } from '@/presentation/components/auth/email-change-section'
import { ActiveSessionsSection } from '@/presentation/components/auth/active-sessions-section'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { captureLoadError } from '@/shared/lib/load-error'
import { captureActionError } from '@/shared/lib/action-error'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { ReferralBanner } from '@/presentation/components/layout/referral-banner'

const VERIFICATION_TYPE_KEYS: Record<string, TranslationKey> = {
  employer: 'verification_type_employer',
  freelancer: 'verification_type_freelancer',
  identity: 'verification_type_identity',
  company: 'verification_type_company',
}

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
        {hint ? <p className="mt-0.5 text-[11px] text-[var(--ishbor-text-muted)]">{hint}</p> : null}
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
  const { t, profile, refreshProfile, mergeProfile, userId, currentUserRole, language, setLanguage, theme, setTheme } = useApp()
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    setBrowserNotif(browserNotificationsEnabled())
  }, [])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const [hourlyRate, setHourlyRate] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('intermediate')
  const [languagesText, setLanguagesText] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteDialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(deleteOpen, deleteDialogRef)
  useEscapeClose(deleteOpen, () => setDeleteOpen(false))
  const [simpleNotif, setSimpleNotif] = useState({
    emailNewOrders: true,
    emailPromotions: false,
    smsUrgent: false,
    telegramConnect: false,
    chatMuted: false,
  })
  const [notifChannels, setNotifChannels] = useState({
    email: false,
    sms: false,
    telegram: false,
    telegram_bot_username: null as string | null,
  })
  const [telegramLinkToken, setTelegramLinkToken] = useState<string | null>(null)
  const telegramHintShown = useRef(false)
  const [verifications, setVerifications] = useState<ApiVerification[]>([])
  const [verificationsLoading, setVerificationsLoading] = useState(false)
  const [verificationsLoadError, setVerificationsLoadError] = useState<unknown>(null)

  const loadVerifications = () => {
    setVerificationsLoading(true)
    setVerificationsLoadError(null)
    api
      .listMyVerifications()
      .then((rows) => {
        setVerifications(rows)
        setVerificationsLoadError(null)
      })
      .catch((e) => {
        setVerifications([])
        setVerificationsLoadError(e)
      })
      .finally(() => setVerificationsLoading(false))
  }

  useAuthedEffect(() => {
    if (activeTab !== 'security') return
    loadVerifications()
  }, [activeTab])

  useEffect(() => {
    api
      .getNotificationPrefs()
      .then(setSimpleNotif)
      .catch((e) => {
        ignoreWithLog(e, { scope: 'notifications', apiPath: '/api/v1/profiles/me/notification-prefs' })
        setSimpleNotif(loadNotificationPrefs())
      })
    api
      .notificationChannels()
      .then((c) =>
        setNotifChannels({
          email: c.email,
          sms: c.sms,
          telegram: c.telegram,
          telegram_bot_username: c.telegram_bot_username,
        })
      )
      .catch((e) => {
        toast.error(captureLoadError(e, { scope: 'notifications', apiPath: '/api/v1/notifications/channels' }, t))
      })
  }, [t])

  useEffect(() => {
    if (!userId || !notifChannels.telegram || profile?.telegram_chat_id) {
      setTelegramLinkToken(null)
      return
    }
    api
      .telegramLinkToken()
      .then((r) => setTelegramLinkToken(r.token))
      .catch((e) => {
        ignoreWithLog(e, { scope: 'notifications', apiPath: '/api/v1/notifications/telegram/link-token' })
        setTelegramLinkToken(null)
      })
  }, [userId, notifChannels.telegram, profile?.telegram_chat_id])

  useEffect(() => {
    if (
      profile?.telegram_chat_id &&
      notifChannels.telegram &&
      !simpleNotif.telegramConnect &&
      !telegramHintShown.current
    ) {
      telegramHintShown.current = true
      toast.info(t('notif_telegram_enable_hint'))
    }
  }, [profile?.telegram_chat_id, notifChannels.telegram, simpleNotif.telegramConnect, t])

  const updateNotifPref = async <K extends keyof typeof simpleNotif>(key: K, value: boolean) => {
    const prev = simpleNotif
    const next = { ...prev, [key]: value }
    setSimpleNotif(next)
    saveNotificationPrefs(next)
    try {
      await api.updateNotificationPrefs({ [key]: value })
      toast.success(t('save_success'))
    } catch (e) {
      setSimpleNotif(prev)
      saveNotificationPrefs(prev)
      toast.error(captureActionError(e, { scope: 'generic', action: 'update_notification_prefs' }, t))
    }
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
      setPortfolioImages(profile.portfolio_urls ?? [])
      setHourlyRate(profile.hourly_rate != null ? String(profile.hourly_rate) : '')
      setExperienceLevel(profile.experience_level ?? 'intermediate')
      setLanguagesText(
        (profile.languages ?? [])
          .map((l) => `${l.lang}:${l.level}`)
          .join(', ')
      )
      if (profile.ui_preferences?.timezone && typeof profile.ui_preferences.timezone === 'string') {
        setTimezone(profile.ui_preferences.timezone)
      }
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
    const slug = normalizeUsername(username)
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
      checkUsernameRemote(slug, { excludeUserId: profile?.id ?? userId })
        .then((r) => setUsernameStatus(r.available ? 'ok' : 'taken'))
        .catch((e) => {
          setUsernameStatus('idle')
          toast.error(captureLoadError(e, { scope: 'profile', apiPath: '/api/v1/profiles/check-username' }, t))
        })
    }, 400)
    return () => clearTimeout(id)
  }, [username, profile?.username, profile?.id, userId, t])

  const profilePath = userId
    ? freelancerPath({ id: userId, username: profile?.username ?? username })
    : PATHS.services
  const profileLink =
    userId && typeof window !== 'undefined'
      ? `${window.location.origin}${profilePath}`
      : profilePath

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
    setBrowserNotificationsEnabled(enabled)
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
      username: prepareUsernameForSubmit(username),
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
      if (!userId) throw new Error(t('error_required'))
      const saved = await persistProfilePatch(userId, {
        full_name: formData.name,
        username: username.trim() || undefined,
        bio,
        region: formData.city,
        phone: formData.phone,
        specialty: title,
        skills: currentUserRole === 'freelancer' ? skills : undefined,
        portfolio_urls: currentUserRole === 'freelancer' ? portfolioImages : undefined,
        hourly_rate:
          currentUserRole === 'freelancer' && hourlyRate.trim()
            ? parseInt(hourlyRate.replace(/\D/g, ''), 10)
            : undefined,
        experience_level: currentUserRole === 'freelancer' ? experienceLevel : undefined,
        languages:
          currentUserRole === 'freelancer'
            ? languagesText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((pair) => {
                  const [lang, level] = pair.split(':').map((x) => x.trim())
                  return { lang: lang || pair, level: level || 'intermediate' }
                })
            : undefined,
      })
      mergeProfile(saved)
      void api.updateUiPreferences({ timezone }).catch(() => undefined)
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
                <ReferralBanner className="mb-4" />
                <p className="text-[13px] leading-relaxed text-[var(--ishbor-text)]">
                  {t('settings_profile_link')}{' '}
                  <Link
                    href={profileLink}
                    className="settings-profile-url-link font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {profilePath}
                  </Link>
                </p>

                <div className="settings-divider" />

                <div className="settings-form-stack mt-5">
                  <div className="settings-field-narrow">
                    <label className="settings-field-label">{t('username')}</label>
                    <Input
                      value={username}
                      maxLength={USERNAME_MAX_LENGTH}
                      onChange={(e) => setUsername(e.target.value.slice(0, USERNAME_MAX_LENGTH))}
                      className="catalog-control !h-[42px]"
                    />
                    {usernameStatus === 'checking' && (
                      <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">{t('username_checking')}</p>
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
                    <label className="settings-field-label">{t('phone')}</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t('settings_phone_placeholder')}
                      className="catalog-control !h-[42px]"
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

                <p className="mt-4 text-[13px] text-[var(--ishbor-text-muted)]">
                  {t('settings_prefs_auto_save')}
                </p>
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
                          const saved = await persistProfilePatch(userId, { avatar_url: url })
                          mergeProfile(saved)
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
                    <p className="mt-1 text-[11px] text-[var(--ishbor-text-muted)]">
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
                    <p className="mt-1 text-[11px] text-[var(--ishbor-text-muted)]">
                      {hintText(t, 'settings_chars_hint', bio.length, 500, 200)}
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
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--ishbor-border)] bg-[var(--neutral-50)] px-2.5 py-1 text-[12px]"
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
                          className="rounded-full border border-dashed border-[var(--ishbor-border)] px-2 py-0.5 text-[11px] text-[var(--ishbor-text-muted)] hover:border-[var(--color-primary)]"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentUserRole === 'freelancer' && (
                    <>
                      <div className="settings-field-narrow">
                        <label className="settings-field-label">{t('hourly_rate_label')}</label>
                        <Input
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder={t('settings_hourly_rate_placeholder')}
                          className="catalog-control !h-[42px]"
                        />
                      </div>
                      <div className="settings-field-narrow">
                        <label className="settings-field-label">{t('experience_level')}</label>
                        <Select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          options={[
                            { value: 'junior', label: t('junior') },
                            { value: 'intermediate', label: t('intermediate') },
                            { value: 'senior', label: t('senior') },
                          ]}
                          className="catalog-control"
                        />
                      </div>
                      <div>
                        <label className="settings-field-label">{t('languages_label')}</label>
                        <Input
                          value={languagesText}
                          onChange={(e) => setLanguagesText(e.target.value)}
                          placeholder={t('settings_languages_placeholder')}
                          className="catalog-control !h-[42px]"
                        />
                      </div>
                    </>
                  )}

                  {currentUserRole === 'freelancer' && (
                    <div>
                      <label className="settings-field-label">{t('portfolio_urls_label')}</label>
                      <p className="mb-2 text-[12px] text-[var(--ishbor-text-muted)]">{t('portfolio_upload_hint')}</p>
                      <FileUploadZone
                        maxFiles={12}
                        maxSizeMb={5}
                        initialUrls={portfolioImages}
                        disabled={portfolioUploading || !userId || !isSupabaseConfigured()}
                        onUrlsChange={setPortfolioImages}
                        onUpload={async (files) => {
                          if (!userId || !files.length) return portfolioImages
                          setPortfolioUploading(true)
                          try {
                            const newUrls = await Promise.all(files.map((f) => uploadPortfolioImage(f, userId)))
                            return [...portfolioImages, ...newUrls].slice(0, 12)
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : t('error_required'))
                            return portfolioImages
                          } finally {
                            setPortfolioUploading(false)
                          }
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="settings-field-label inline-flex items-center gap-1">
                      {t('settings_business_hours')}
                      <HelpCircle className="h-3.5 w-3.5 text-[var(--ishbor-text-muted)]" />
                    </label>
                    <p className="text-[13px] text-[var(--ishbor-text-muted)]">
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
                    <div className="max-w-[520px] h-28 overflow-hidden rounded-lg border border-[var(--ishbor-border)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)]" />
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
                    <Link
                      href={freelancerPath({ id: userId, username: profile?.username ?? username })}
                      className="settings-link-action"
                    >
                      {t('view_profile')} →
                    </Link>
                  )}
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('change_email')}</h2>
                  <EmailChangeSection />
                </div>

                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('active_sessions')}</h2>
                  <ActiveSessionsSection />
                </div>

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
                          passwordToggleShowLabel={t('show_password')}
                          passwordToggleHideLabel={t('hide_password')}
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
                          passwordToggleShowLabel={t('show_password')}
                          passwordToggleHideLabel={t('hide_password')}
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
                  <h2 className="settings-section-title">{t('verification_request')}</h2>
                  <p className="settings-section-note">{t('verification_request_desc')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={async () => {
                      try {
                        const vType =
                          profile?.role === 'freelancer' ? 'freelancer' : 'employer'
                        await api.requestVerification({ verification_type: vType })
                        toast.success(t('verification_submitted'))
                        const list = await api.listMyVerifications()
                        setVerifications(list)
                        setVerificationsLoadError(null)
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : t('error_required'))
                      }
                    }}
                  >
                    {t('verification_submit')}
                  </Button>
                  {verificationsLoadError ? (
                    <LoadErrorAlert
                      error={verificationsLoadError}
                      scope="profile"
                      onRetry={loadVerifications}
                      className="mt-4"
                    />
                  ) : null}
                  {(verificationsLoading || verifications.length > 0) && !verificationsLoadError && (
                    <div className="mt-5">
                      <h3 className="text-[13px] font-semibold text-[var(--ishbor-text)]">
                        {t('verification_history')}
                      </h3>
                      {verificationsLoading ? (
                        <div className="mt-2 h-12 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {verifications.map((v) => {
                            const statusKey =
                              v.status === 'approved'
                                ? 'verification_status_approved'
                                : v.status === 'rejected'
                                  ? 'verification_status_rejected'
                                  : 'verification_status_pending'
                            return (
                              <li
                                key={v.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--ishbor-border)] px-3 py-2 text-[13px]"
                              >
                                <span className="font-medium">
                                  {t(VERIFICATION_TYPE_KEYS[v.verification_type] ?? 'verification_type_identity')}
                                </span>
                                <span className="text-[var(--ishbor-text-muted)]">{t(statusKey)}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('company_section_title')}</h2>
                  <p className="settings-section-note">{t('company_section_desc')}</p>
                  <div className="mt-4">
                    <CompanySelfServiceSection />
                  </div>
                </div>

                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('stir_section_title')}</h2>
                  <p className="settings-section-note">{t('stir_section_desc')}</p>
                  <div className="mt-4">
                    <CompanyStirSection />
                  </div>
                </div>

                <div className="settings-security-block">
                  <h2 className="settings-section-title">{t('two_factor')}</h2>
                  <p className="settings-section-note">{t('two_factor_desc')}</p>
                  <TotpSettingsSection />
                </div>
              </>
            )}

            {activeTab === 'withdrawal' && (
              <>
                <div className="rounded-lg border border-[var(--ishbor-border)] bg-[var(--neutral-50)] p-5">
                  <h2 className="settings-section-title">
                    {t('settings_verify_phone_title')}
                  </h2>
                  <p className="mt-1 text-[13px] text-[var(--ishbor-text-muted)]">
                    {t('settings_verify_phone_desc')}
                  </p>
                  <PhoneVerifySection
                    phone={formData.phone}
                    verified={Boolean(profile?.phone_verified_at)}
                    onVerified={() => void refreshProfile()}
                  />
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
                    <p className="mb-2 text-[12px] text-[var(--ishbor-text-muted)]">{t('settings_card_desc')}</p>
                    <Input
                      disabled
                      placeholder={t('settings_verify_required')}
                      className="catalog-control !h-[42px] bg-[var(--neutral-50)]"
                    />
                  </div>
                </div>

              </>
            )}

            {activeTab === 'account' && (
              <>
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
                      className="w-full max-w-md rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 id="delete-account-title" className="text-[16px] font-bold text-[var(--error-dark)]">{t('delete_account_confirm')}</h3>
                      <p className="mt-2 text-[13px] text-[var(--ishbor-text-muted)]">{t('delete_account_confirm_hint')}</p>
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
                <NotificationChannelStatus
                  email={notifChannels.email}
                  sms={notifChannels.sms}
                  telegram={notifChannels.telegram}
                />
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
                  {notifChannels.telegram ? (
                    profile?.telegram_chat_id ? (
                      <ToggleRow
                        label={t('connect_telegram')}
                        checked={simpleNotif.telegramConnect}
                        onChange={(v) => updateNotifPref('telegramConnect', v)}
                        hint={t('notif_telegram_connected')}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('notif_telegram_connect_desc')}</p>
                        {userId && notifChannels.telegram_bot_username && telegramLinkToken && (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`https://t.me/${notifChannels.telegram_bot_username}?start=${telegramLinkToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                            >
                              <Button variant="outline" size="sm" type="button">
                                {t('notif_telegram_connect_btn')}
                              </Button>
                            </a>
                            <Button variant="ghost" size="sm" type="button" onClick={() => refreshProfile()}>
                              {t('notif_telegram_check')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <ToggleRow
                      label={t('connect_telegram')}
                      checked={false}
                      disabled
                      hint={t('notif_integration_soon')}
                      onChange={() => undefined}
                    />
                  )}
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

                <p className="mt-4 text-[12px] text-[var(--ishbor-text-muted)]">{t('settings_prefs_auto_save')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
