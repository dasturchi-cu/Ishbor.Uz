"""Write simplified 2-step onboarding-page.tsx as clean UTF-8."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/presentation/features/onboarding/onboarding-page.tsx"

OUT.write_text(
    """'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { api, ApiError } from '@/infrastructure/api/client'
import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { pickAvailableUsername } from '@/shared/lib/username'
import { parseSpecialtyTitle } from '@/shared/lib/onboarding-profile'
import { toast } from '@/presentation/components/ui/toast'

const ONBOARDING_STEP_KEY = 'ishbor-onboarding-step'
const REGISTER_REGION_KEY = 'ishbor-register-region'

function readStoredRegion(): string {
  if (typeof window === 'undefined') return ''
  const saved = sessionStorage.getItem(REGISTER_REGION_KEY)
  return saved && (UZ_REGIONS as readonly string[]).includes(saved) ? saved : ''
}

function OnboardingShell({
  step,
  totalSteps,
  title,
  children,
  footer,
}: {
  step: number
  totalSteps: number
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useApp()
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="onboarding-page min-h-[calc(100vh-var(--ishbor-header-h))] bg-[var(--body-bg)] px-4 py-8">
      <div className="onboarding-shell">
        <div className="onboarding-shell__progress">
          <div
            className="onboarding-shell__bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="onboarding-shell__step">
            {t('step_n_of_total').replace('{n}', String(step)).replace('{total}', String(totalSteps))}
          </p>
        </div>
        <div className="onboarding-shell__card">
          <h1 className="onboarding-shell__title">{title}</h1>
          {children}
          {footer}
        </div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const { t, profile, currentUserRole, refreshProfile, mergeProfile, userId } = useApp()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const isClient = currentUserRole === 'client'
  const totalSteps = 2
  const [step, setStep] = useState(1)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState(readStoredRegion)
  const [company, setCompany] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'error'>('idle')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAutoSavedRef = useRef<string>('')
  const autoSavingRef = useRef(false)
  const profileHydratedRef = useRef(false)
  const skipAutoSaveUntilRef = useRef(0)

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.replace(dashboardPathForRole(currentUserRole))
    }
  }, [profile?.onboarding_completed, currentUserRole, router])

  useEffect(() => {
    if (profile?.onboarding_completed) return
    const saved = sessionStorage.getItem(ONBOARDING_STEP_KEY)
    if (saved) {
      const n = Number(saved)
      if (n >= 1 && n <= totalSteps) setStep(n)
    }
  }, [totalSteps, profile?.onboarding_completed])

  useEffect(() => {
    sessionStorage.setItem(ONBOARDING_STEP_KEY, String(step))
  }, [step])

  useEffect(() => {
    if (username.trim().length >= 3 || profile?.username) return
    let cancelled = false
    void (async () => {
      let email = profile?.email
      if (!email && isSupabaseConfigured()) {
        const { data: { user } } = await getSupabase().auth.getUser()
        email = user?.email ?? undefined
      }
      if (!email) return
      try {
        const slug = await pickAvailableUsername(email, profile?.full_name ?? fullName)
        if (!cancelled) {
          setUsername(slug)
          setUsernameStatus('ok')
        }
      } catch {
        if (!cancelled && fullName.trim().length > 1) {
          try {
            const slug = await pickAvailableUsername(`${fullName.replace(/\s/g, '')}@local.dev`, fullName)
            if (!cancelled) {
              setUsername(slug)
              setUsernameStatus('ok')
            }
          } catch {
            /* manual */
          }
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.email, profile?.full_name, profile?.username, fullName, username])

  useEffect(() => {
    if (!profile?.id || profileHydratedRef.current) return
    profileHydratedRef.current = true
    skipAutoSaveUntilRef.current = Date.now() + 1500
    setFullName(profile.full_name || '')
    if (profile.username) {
      setUsername(profile.username)
      setUsernameStatus('ok')
    }
    setCity(profile.region || readStoredRegion())
    if (isClient) {
      setCompany(profile.specialty?.trim() || '')
    } else {
      setBio(profile.bio || '')
      setTitle(parseSpecialtyTitle(profile.specialty))
    }
  }, [profile?.id, profile, isClient])

  useEffect(() => {
    if (city.trim() || !isSupabaseConfigured()) return
    getSupabase()
      .auth.getUser()
      .then(({ data: { user } }) => {
        const fromMeta = user?.user_metadata?.region
        if (
          typeof fromMeta === 'string' &&
          fromMeta.trim() &&
          (UZ_REGIONS as readonly string[]).includes(fromMeta.trim())
        ) {
          setCity(fromMeta.trim())
        }
      })
      .catch(() => undefined)
  }, [city])

  useEffect(() => {
    if (!isClient || company || !isSupabaseConfigured()) return
    getSupabase()
      .auth.getUser()
      .then(({ data: { user } }) => {
        const fromMeta = user?.user_metadata?.company
        if (typeof fromMeta === 'string' && fromMeta.trim()) {
          setCompany(fromMeta.trim())
        }
      })
      .catch(() => undefined)
  }, [isClient, company])

  useEffect(() => {
    const slug = username.trim().toLowerCase().replace(/^@/, '')
    if (slug.length < 3) {
      setUsernameStatus('idle')
      return
    }
    const ownSlug = profile?.username?.toLowerCase()
    if (ownSlug && slug === ownSlug) {
      setUsernameStatus('ok')
      return
    }
    setUsernameStatus('checking')
    const id = setTimeout(() => {
      api
        .checkUsername(slug)
        .then((r) => setUsernameStatus(r.available ? 'ok' : 'taken'))
        .catch(() => setUsernameStatus('error'))
    }, 400)
    return () => clearTimeout(id)
  }, [username, profile?.username])

  const step1Valid = useMemo(() => {
    const base =
      fullName.trim().length > 1 &&
      username.trim().length > 2 &&
      usernameStatus === 'ok' &&
      city.trim().length > 0
    if (isClient) return base
    return base && title.trim().length > 2 && bio.trim().length >= 10
  }, [fullName, username, usernameStatus, city, title, bio, isClient])

  const profilePayload = useCallback(
    (complete: boolean) => {
      const specialtyValue = !isClient ? title.trim() || undefined : company.trim() || undefined
      const bioValue = !isClient
        ? bio.trim() || undefined
        : company.trim()
          ? `${company.trim()}${bio.trim() ? ` - ${bio.trim()}` : ''}`
          : bio.trim() || undefined

      return {
        full_name: fullName.trim() || undefined,
        username: username.trim().replace(/^@/, '') || undefined,
        region: city.trim() || undefined,
        specialty: specialtyValue,
        bio: bioValue,
        experience_level: !isClient ? ('mid' as const) : undefined,
        ...(complete ? { onboarding_completed: true as const } : {}),
      }
    },
    [isClient, title, company, bio, fullName, username, city],
  )

  const persistProfile = useCallback(
    async (complete: boolean) => {
      let finalUsername = username.trim().replace(/^@/, '')
      if (finalUsername.length < 3 || usernameStatus !== 'ok') {
        let email = profile?.email
        if (!email && isSupabaseConfigured()) {
          const { data: { user } } = await getSupabase().auth.getUser()
          email = user?.email ?? undefined
        }
        if (email) {
          finalUsername = await pickAvailableUsername(email, fullName.trim())
          setUsername(finalUsername)
          setUsernameStatus('ok')
        }
      }
      const updated = await api.updateProfile(profilePayload(complete))
      const withRole =
        updated.role === currentUserRole
          ? updated
          : await api.updateProfileRole(currentUserRole)
      mergeProfile({ ...withRole, role: currentUserRole })
      lastAutoSavedRef.current = JSON.stringify(profilePayload(complete))
      sessionStorage.removeItem(REGISTER_REGION_KEY)
      return updated
    },
    [username, usernameStatus, profile?.email, fullName, currentUserRole, mergeProfile, profilePayload],
  )

  const canAutoSave = useMemo(() => {
    if (!profile?.id || profile.onboarding_completed) return false
    if (fullName.trim().length <= 1 || !city.trim()) return false
    if (username.trim().length >= 3 && usernameStatus === 'taken') return false
    if (username.trim().length >= 3 && usernameStatus === 'checking') return false
    if (!isClient && username.trim().length >= 3 && usernameStatus === 'error') return false
    return true
  }, [profile?.id, profile?.onboarding_completed, fullName, city, username, usernameStatus, isClient])

  const runAutoSave = useCallback(async () => {
    if (!canAutoSave || autoSavingRef.current || saving) return
    if (Date.now() < skipAutoSaveUntilRef.current) return
    const key = JSON.stringify(profilePayload(false))
    if (key === lastAutoSavedRef.current) return
    autoSavingRef.current = true
    try {
      await persistProfile(false)
    } catch {
      /* silent */
    } finally {
      autoSavingRef.current = false
    }
  }, [canAutoSave, saving, persistProfile, profilePayload])

  useEffect(() => {
    if (!canAutoSave) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      void runAutoSave()
    }, 1200)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [canAutoSave, runAutoSave, fullName, username, title, bio, city, company, currentUserRole])

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length <= 1) errs.fullName = t('onboarding_err_full_name')
    if (username.trim().length < 3) errs.username = t('onboarding_err_username')
    if (!city.trim()) errs.city = t('onboarding_err_region')
    if (usernameStatus === 'checking') return null
    if (usernameStatus === 'taken') errs.username = t('username_taken')
    if (usernameStatus !== 'ok' && username.trim().length >= 3) errs.username = t('username_check_failed')
    if (!isClient) {
      if (title.trim().length <= 2) errs.title = t('onboarding_err_title')
      if (bio.trim().length < 10) errs.bio = t('onboarding_err_bio')
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return false
    }
    setFieldErrors({})
    return true
  }

  const goToStep2 = async () => {
    if (!validateStep1()) return
    setSaving(true)
    try {
      await persistProfile(false)
      setStep(2)
    } catch (e) {
      const detail = e instanceof ApiError ? e.message : t('onboarding_save_error')
      toast.error(detail || t('onboarding_save_error'))
    } finally {
      setSaving(false)
    }
  }

  const finish = async (): Promise<boolean> => {
    setSaving(true)
    try {
      await persistProfile(true)
    } catch (e) {
      const detail = e instanceof ApiError ? e.message : t('onboarding_save_error')
      toast.error(detail || t('onboarding_save_error'))
      return false
    } finally {
      setSaving(false)
    }
    await refreshProfile()
    sessionStorage.removeItem(ONBOARDING_STEP_KEY)
    toast.success(t('onboarding_complete_success'))
    return true
  }

  const completeAndGo = async (href: string) => {
    if (profile?.onboarding_completed) {
      router.push(href)
      return
    }
    const ok = await finish()
    if (ok) router.push(href)
  }

  const completeAndGoDashboard = async () => {
    if (profile?.onboarding_completed) {
      router.push(dashboardPathForRole(currentUserRole))
      return
    }
    const ok = await finish()
    if (ok) router.push(dashboardPathForRole(currentUserRole))
  }

  if (step === 1) {
    return (
      <OnboardingShell
        step={step}
        totalSteps={totalSteps}
        title={isClient ? t('onboarding_client_profile_title') : t('onboarding_profile_title')}
        footer={
          <>
            <Button
              variant="primary"
              fullWidth
              disabled={!step1Valid || saving}
              loading={saving}
              className="mt-8"
              onClick={() => void goToStep2()}
            >
              {t('continue_btn')}
            </Button>
            <button
              type="button"
              disabled={!step1Valid || saving}
              onClick={() => void completeAndGoDashboard()}
              className="onboarding-skip"
            >
              {t('skip')}
            </button>
            {isClient && (
              <p className="mt-6 text-center text-[12px] text-[var(--ishbor-text-muted)]">
                {t('client_find_freelancer_hint')}
              </p>
            )}
          </>
        }
      >
        <div className="onboarding-fields">
          <FileUploadZone
            circular
            maxFiles={1}
            disabled={avatarUploading || !userId}
            initialUrls={profile?.avatar_url ? [profile.avatar_url] : []}
            onUpload={async (files) => {
              if (!userId || !files[0]) {
                toast.error(t('upload_error'))
                return []
              }
              if (!isSupabaseConfigured()) {
                toast.error(t('auth_supabase_not_configured'))
                return []
              }
              setAvatarUploading(true)
              try {
                const url = await uploadAvatar(files[0], userId)
                await api.updateProfile({ avatar_url: url })
                await refreshProfile()
                return [url]
              } catch (e) {
                toast.error(e instanceof Error ? e.message : t('upload_error'))
                return []
              } finally {
                setAvatarUploading(false)
              }
            }}
          />
          <Input
            label={t('full_name')}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              clearFieldError('fullName')
            }}
            error={fieldErrors.fullName}
          />
          <div>
            <Input
              label={t('username')}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearFieldError('username')
              }}
              placeholder={t('username_ph')}
              error={fieldErrors.username}
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
            {usernameStatus === 'error' && (
              <p className="mt-1 text-[12px] text-[var(--error)]">{t('username_check_failed')}</p>
            )}
          </div>
          {!isClient && (
            <>
              <Input
                label={t('professional_title')}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  clearFieldError('title')
                }}
                placeholder={t('professional_title_ph')}
                error={fieldErrors.title}
              />
              <div>
                <Textarea
                  label={t('bio')}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    clearFieldError('bio')
                  }}
                  placeholder={t('bio_ph')}
                  rows={4}
                  error={fieldErrors.bio}
                />
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--ishbor-text-muted)]">
                  <span>{t('onboarding_bio_hint')}</span>
                  <span className="shrink-0">
                    {t('char_counter').replace('{n}', String(bio.length)).replace('{max}', '500')}
                  </span>
                </div>
              </div>
            </>
          )}
          {isClient && (
            <Input
              label={t('company_name')}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('company_optional')}
            />
          )}
          <Select
            label={t('city')}
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              clearFieldError('city')
            }}
            placeholder={t('select')}
            options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
            className="catalog-control"
            error={fieldErrors.city}
          />
        </div>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell
      step={step}
      totalSteps={totalSteps}
      title={isClient ? t('onboarding_client_project_title') : t('onboarding_first_service_title')}
      footer={
        <button
          type="button"
          disabled={saving}
          onClick={() => void completeAndGoDashboard()}
          className="onboarding-skip mt-6"
        >
          {t('decide_later')}
        </button>
      }
    >
      <p className="onboarding-next-desc">
        {isClient ? t('post_project_now_desc') : t('create_service_desc')}
      </p>
      <div className="onboarding-next-actions">
        {isClient ? (
          <>
            <Button
              variant="primary"
              fullWidth
              loading={saving}
              onClick={() => void completeAndGo(PATHS.postProject)}
            >
              {t('post_project_btn')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              disabled={saving}
              onClick={() => void completeAndGo(PATHS.services)}
            >
              {t('go_to_catalog')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              fullWidth
              loading={saving}
              onClick={() => void completeAndGo(PATHS.dashboardServicesNew)}
            >
              {t('btn_create_service')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              disabled={saving}
              onClick={() => void completeAndGoDashboard()}
            >
              {t('nav_dashboard')}
            </Button>
          </>
        )}
      </div>
    </OnboardingShell>
  )
}
""",
    encoding="utf-8",
    newline="\n",
)
print(f"wrote {OUT} ({OUT.read_text(encoding='utf-8').count(chr(10)) + 1} lines)")
