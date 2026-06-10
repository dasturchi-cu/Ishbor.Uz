'use client'

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
import { captureActionError } from '@/shared/lib/action-error'
import { checkUsernameRemote } from '@/shared/lib/check-username-remote'
import { persistProfilePatch } from '@/shared/lib/persist-profile-patch'
import { uploadAvatar, formatStorageUploadError } from '@/infrastructure/supabase/storage'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { normalizeUsername, pickAvailableUsername, prepareUsernameForSubmit, USERNAME_MAX_LENGTH, isUsernameLengthValid } from '@/shared/lib/username'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { parseSpecialtyTitle } from '@/shared/lib/onboarding-profile'
import { toast } from '@/presentation/components/ui/toast'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

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
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
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
  const [usernameCheckHint, setUsernameCheckHint] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const lastAutoSavedRef = useRef<string>('')
  const profileHydratedRef = useRef(false)
  const skipAutoSaveUntilRef = useRef(0)
  const userEditedUsernameRef = useRef(false)
  const usernamePickGenRef = useRef(0)
  const usernameCheckSeqRef = useRef(0)
  const { ready: authReady } = useAuthReady()

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
    if (userEditedUsernameRef.current || profile?.username) return
    const pickGen = usernamePickGenRef.current
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
        if (!cancelled && pickGen === usernamePickGenRef.current && !userEditedUsernameRef.current) {
          setUsername(slug)
          setUsernameStatus('ok')
        }
      } catch {
        if (!cancelled && pickGen === usernamePickGenRef.current && !userEditedUsernameRef.current && fullName.trim().length > 1) {
          try {
            const slug = await pickAvailableUsername(`${fullName.replace(/\s/g, '')}@local.dev`, fullName)
            if (!cancelled && pickGen === usernamePickGenRef.current && !userEditedUsernameRef.current) {
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
  }, [profile?.id, profile?.email, profile?.full_name, profile?.username, fullName])

  useEffect(() => {
    if (!profile?.id || profileHydratedRef.current) return
    profileHydratedRef.current = true
    skipAutoSaveUntilRef.current = Date.now() + 1500
    setFullName(profile.full_name || '')
    if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
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
      .catch((e) => ignoreWithLog(e, { scope: 'auth', apiPath: 'supabase/user-metadata/region' }))
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
      .catch((e) => ignoreWithLog(e, { scope: 'auth', apiPath: 'supabase/user-metadata/company' }))
  }, [isClient, company])

  useEffect(() => {
    if (!authReady) return

    const slug = normalizeUsername(username)
    if (slug.length < 3) {
      setUsernameStatus('idle')
      setUsernameCheckHint('')
      return
    }
    if (slug.length > USERNAME_MAX_LENGTH) {
      setUsernameStatus('error')
      setUsernameCheckHint(t('onboarding_err_username_long'))
      return
    }
    const ownSlug = profile?.username ? normalizeUsername(profile.username) : ''
    if (ownSlug && slug === ownSlug) {
      setUsernameStatus('ok')
      return
    }

    setUsernameStatus('checking')
    setUsernameCheckHint('')
    const seq = ++usernameCheckSeqRef.current
    const abort = new AbortController()
    const id = setTimeout(() => {
      void checkUsernameRemote(slug, { excludeUserId: profile?.id ?? userId, signal: abort.signal })
        .then((r) => {
          if (abort.signal.aborted || seq !== usernameCheckSeqRef.current) return
          setUsernameStatus(r.available ? 'ok' : 'taken')
          setUsernameCheckHint('')
        })
        .catch((e) => {
          if (abort.signal.aborted || seq !== usernameCheckSeqRef.current) return
          if (e instanceof ApiError && (e.status === 499 || e.status === 408)) return
          setUsernameStatus('error')
          setUsernameCheckHint(t('username_check_failed'))
        })
    }, 300)

    return () => {
      clearTimeout(id)
      abort.abort()
    }
  }, [username, profile?.username, profile?.id, userId, authReady, t])

  const step1Valid = useMemo(() => {
    const base =
      fullName.trim().length > 1 &&
      isUsernameLengthValid(username) &&
      usernameStatus === 'ok' &&
      city.trim().length > 0
    if (isClient) return base
    return base && title.trim().length > 2 && bio.trim().length >= 10
  }, [fullName, username, usernameStatus, city, title, bio, isClient])

  const profilePayload = useCallback(
    (complete: boolean, usernameOverride?: string) => {
      const resolvedUsername = prepareUsernameForSubmit(usernameOverride ?? username)
      const specialtyValue = !isClient ? title.trim() || undefined : company.trim() || undefined
      const bioValue = !isClient
        ? bio.trim() || undefined
        : company.trim()
          ? `${company.trim()}${bio.trim() ? ` - ${bio.trim()}` : ''}`
          : bio.trim() || undefined

      return {
        full_name: fullName.trim() || undefined,
        username: resolvedUsername,
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
      if (!userId) throw new Error(t('auth_supabase_not_configured'))
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
      const payload = { ...profilePayload(complete, finalUsername), role: currentUserRole }
      const updated = await persistProfilePatch(userId, payload)
      mergeProfile({ ...updated, role: currentUserRole })
      lastAutoSavedRef.current = JSON.stringify(payload)
      sessionStorage.removeItem(REGISTER_REGION_KEY)
      return updated
    },
    [userId, username, usernameStatus, profile?.email, fullName, currentUserRole, mergeProfile, profilePayload, t],
  )

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length <= 1) errs.fullName = t('onboarding_err_full_name')
    if (username.trim().length < 3) errs.username = t('onboarding_err_username')
    else if (!isUsernameLengthValid(username)) errs.username = t('onboarding_err_username_long')
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
    const valid = validateStep1()
    if (valid === null) {
      toast.error(t('username_checking'))
      return
    }
    if (!valid) return
    setSaving(true)
    try {
      await persistProfile(false)
      setStep(2)
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'generic', apiPath: '/api/v1/profiles/me' }, t))
    } finally {
      setSaving(false)
    }
  }

  const finish = async (): Promise<boolean> => {
    setSaving(true)
    try {
      await persistProfile(true)
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'generic', apiPath: '/api/v1/profiles/me' }, t))
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
              disabled={saving}
              onClick={() => void completeAndGoDashboard()}
              className="onboarding-skip"
            >
              {t('skip')}
            </button>
            <p className="mt-2 text-center text-[12px] text-[var(--ishbor-text-muted)]">
              {t('onboarding_skip_hint')}
            </p>
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
            initialUrls={avatarUrl ? [avatarUrl] : []}
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
                setAvatarUrl(url)
                const updated = await api.updateProfile({ avatar_url: url })
                mergeProfile({ avatar_url: updated.avatar_url ?? url })
                toast.success(t('profile_photo_done'))
                return [url]
              } catch (e) {
                const storageMsg = formatStorageUploadError(e, 'avatars')
                toast.error(storageMsg.includes('pnpm db:push') ? t('storage_bucket_missing') : storageMsg || t('upload_error'))
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
              maxLength={USERNAME_MAX_LENGTH}
              onChange={(e) => {
                userEditedUsernameRef.current = true
                usernamePickGenRef.current += 1
                setUsername(e.target.value.slice(0, USERNAME_MAX_LENGTH))
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
              <p className="mt-1 text-[12px] text-[var(--error)]">
                {usernameCheckHint || t('username_check_failed')}
              </p>
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
