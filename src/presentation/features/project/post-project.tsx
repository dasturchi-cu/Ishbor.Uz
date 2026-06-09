'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { Card } from '@/presentation/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { PATHS } from '@/domain/constants/routes'
import { ChevronRight, ChevronLeft, Upload, Zap, X } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { api, ApiError } from '@/infrastructure/api/client'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { uploadProjectImage, removeProjectImage } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { TranslationKey } from '@/infrastructure/i18n'
import { useServerDraft } from '@/shared/lib/use-server-draft'
import { postProjectSchema } from '@/domain/validators/project'
import { formatDate } from '@/shared/lib/format-date'
import { formatPrice } from '@/shared/lib/format'
import { ensureProfileRole } from '@/shared/lib/ensure-profile-role'
import { captureActionError } from '@/shared/lib/action-error'
import { toast } from '@/presentation/components/ui/toast'
import { SkeletonFormPanel } from '@/presentation/components/ui/skeleton'
import { AiSuggestButton } from '@/presentation/components/ui/ai-suggest-button'

type UploadedFile = { url: string; name: string }

type PostProjectForm = {
  title: string
  description: string
  category: string
  skills: string[]
  budget: string
  budgetType: string
  deadlineDays: string
  level: string
  city: string
}

const POST_PROJECT_INITIAL_FORM: PostProjectForm = {
  title: '',
  description: '',
  category: 'design',
  skills: [],
  budget: '',
  budgetType: 'fixed',
  deadlineDays: '',
  level: 'intermediate',
  city: 'Toshkent shahri',
}

const MAX_BUDGET = 2_147_483_647

const DEADLINE_PRESETS: { days: number; labelKey: TranslationKey }[] = [
  { days: 7, labelKey: 'project_deadline_7d' },
  { days: 14, labelKey: 'project_deadline_14d' },
  { days: 30, labelKey: 'project_deadline_30d' },
  { days: 60, labelKey: 'project_deadline_60d' },
]

const VALID_DEADLINE_DAYS = new Set(DEADLINE_PRESETS.map((p) => p.days))

function resolveDeadlineIso(deadlineDays: string): string | null {
  const days = Number(deadlineDays)
  if (!VALID_DEADLINE_DAYS.has(days)) return null
  return isoFromDays(days)
}

function isoFromDays(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fieldMsg(template: string, field: string, n?: number): string {
  return template.replace('{field}', field).replace('{n}', String(n ?? ''))
}

function formatFieldError(
  t: (key: TranslationKey) => string,
  fieldLabel: string,
  kind: 'required' | 'min',
  min = 10
): string {
  if (kind === 'min') return fieldMsg(t('error_field_min_chars'), fieldLabel, min)
  return fieldMsg(t('error_field_required'), fieldLabel)
}

export function PostProject() {
  const { t, userId, isLoggedIn, isAuthLoading, language, currentUserRole, profile, refreshProfile, mergeProfile } = useApp()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(POST_PROJECT_INITIAL_FORM)
  const draftHydrated = useRef(false)
  const draft = useServerDraft('post-project', formData, isLoggedIn, (remote) => {
    const restored = { ...POST_PROJECT_INITIAL_FORM, ...remote } as PostProjectForm
    if (!draftHydrated.current && (restored.title || restored.description || restored.budget)) {
      draftHydrated.current = true
      setFormData(restored)
      toast.info(t('draft_restored'))
    }
  })

  useEffect(() => {
    if (draftHydrated.current) return
    draftHydrated.current = true
    const restored = draft.hydrate(POST_PROJECT_INITIAL_FORM) as PostProjectForm
    if (restored.title || restored.description || restored.budget) {
      setFormData(restored)
    }
  }, [draft])

  const deadlinePreview = formData.deadlineDays
    ? t('project_deadline_until').replace(
        '{date}',
        formatDate(isoFromDays(Number(formData.deadlineDays)), language),
      )
    : ''
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearFieldError(field)
    if (error) setError('')
  }

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateStep1 = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (formData.title.trim().length < 3) {
      errs.title = formatFieldError(t, t('project_title'), 'min', 3)
    }
    if (formData.description.trim().length < 10) {
      errs.description = formatFieldError(t, t('project_description'), 'min', 10)
    }
    return errs
  }

  const validateStep2 = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    const budget = parseInt(formData.budget.replace(/\D/g, ''), 10)
    if (!budget || budget <= 0) {
      errs.budget = formatFieldError(t, t('budget_amount'), 'required')
    } else if (budget > MAX_BUDGET) {
      errs.budget = t('error_price_too_large')
    }
    return errs
  }

  const validateAll = (): Record<string, string> => {
    const errs = { ...validateStep1(), ...validateStep2() }
    if (Object.keys(errs).length > 0) return errs
    const budget = parseInt(formData.budget.replace(/\D/g, ''), 10)
    const parsed = postProjectSchema.safeParse({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      region: formData.city,
      budget,
    })
    if (!parsed.success) {
      const fieldLabels: Record<string, string> = {
        title: t('project_title'),
        description: t('project_description'),
        budget: t('budget_amount'),
        category: t('category'),
        region: t('city'),
      }
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (!key || errs[key]) continue
        const label = fieldLabels[key] ?? key
        if (issue.code === 'too_small' && key !== 'budget') {
          errs[key] = formatFieldError(t, label, 'min', Number(issue.minimum))
        } else if (issue.code === 'too_small') {
          errs[key] = formatFieldError(t, label, 'required')
        } else {
          errs[key] = formatFieldError(t, label, 'required')
        }
      }
    }
    return errs
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return
    if (!isSupabaseConfigured()) {
      setUploadError(t('auth_supabase_not_configured'))
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      for (const file of Array.from(files)) {
        const url = await uploadProjectImage(file, userId)
        setAttachments((prev) => [...prev, { url, name: file.name }])
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : t('upload_error'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAttachment = async (item: UploadedFile) => {
    if (userId) {
      try {
        await removeProjectImage(item.url, userId)
      } catch {
        // ignore
      }
    }
    setAttachments((prev) => prev.filter((a) => a.url !== item.url))
  }

  const handleNextStep = async () => {
    if (step === 1) {
      const errs = validateStep1()
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setError(Object.values(errs).join(' · '))
        return
      }
      setFieldErrors({})
      setError('')
      setStep(2)
      return
    }

    if (step === 2) {
      const errs = validateStep2()
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setError(Object.values(errs).join(' · '))
        return
      }
      setFieldErrors({})
      setError('')
      setStep(3)
      return
    }

    await submitProject(false)
  }

  const submitProject = async (asDraft: boolean) => {
    const allErrs = validateAll()
    if (Object.keys(allErrs).length > 0) {
      setFieldErrors(allErrs)
      setError(Object.values(allErrs).join(' · '))
      if (allErrs.title || allErrs.description) setStep(1)
      else if (allErrs.budget) setStep(2)
      return
    }

    const budget = parseInt(formData.budget.replace(/\D/g, ''), 10)

    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      if (currentUserRole !== 'client') {
        setError(t('client_only_order'))
        return
      }
      const roleSync = await ensureProfileRole('client', profile)
      if (!roleSync.ok) {
        const msg = roleSync.message
          ? mapAuthErrorMessage(roleSync.message, t)
          : t('role_sync_failed')
        setError(msg)
        toast.error(msg)
        return
      }
      mergeProfile(roleSync.profile)

      await api.createProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        skills: formData.skills,
        budget,
        budget_type: formData.budgetType,
        deadline: resolveDeadlineIso(formData.deadlineDays),
        level: formData.level,
        region: formData.city,
        attachment_urls: attachments.map((a) => a.url),
        is_public: !asDraft,
      })
      draft.clear()
      if (asDraft) {
        toast.success(t('project_saved_draft'))
        router.push(PATHS.dashboardProjects)
      } else {
        toast.success(t('project_posted'))
        router.push(`${PATHS.dashboardProjects}?posted=1`)
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapAuthErrorMessage(e.message, t))
      } else {
        setError(captureActionError(e, { scope: 'project_create' }, t))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const categories = [
    { id: 'design', label: t('design') },
    { id: 'programming', label: t('programming') },
    { id: 'writing', label: t('writing') },
    { id: 'marketing', label: t('categories_marketing') },
  ]

  const levels = [
    { id: 'beginner', label: t('beginner') },
    { id: 'intermediate', label: t('intermediate') },
    { id: 'advanced', label: t('advanced') },
  ]

  const cities = UZ_REGIONS

  const stepTitles = [t('tab_basic'), t('budget_type'), t('preview')]

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(PATHS.login)
    }
  }, [isAuthLoading, isLoggedIn, router])

  useEffect(() => {
    if (currentUserRole !== 'client' || !profile || profile.role === 'client') return
    ensureProfileRole('client', profile)
      .then((result) => {
        if (result.ok) {
          mergeProfile(result.profile)
          refreshProfile().catch(() => undefined)
        }
      })
      .catch(() => undefined)
  }, [currentUserRole, profile, refreshProfile, mergeProfile])

  if (isAuthLoading || !isLoggedIn) {
    return (
      <div className="post-project-page min-h-[calc(100vh-var(--ishbor-header-h))] bg-[var(--neutral-50)] px-4 py-8 sm:px-6 md:py-12">
        <SkeletonFormPanel />
      </div>
    )
  }

  return (
    <div className="post-project-page min-h-[calc(100vh-var(--ishbor-header-h))] bg-[var(--neutral-50)] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="post-project-shell form-shell">
        <div className="surface-panel overflow-hidden">
          <div className="border-b border-[var(--ishbor-border)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--neutral-0)] px-6 py-6 sm:px-8">
            <h1 className="text-[22px] font-bold text-[var(--ishbor-text)] sm:text-[24px]">
              {t('post_your_project')}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--ishbor-text-muted)]">
              {t('post_project_marketplace_hint')}
            </p>
            <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">
              {t('register_step_label').replace('{n}', String(step)).replace('{total}', '3')}
            </p>

            <div className="mt-5 flex gap-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-1 flex-col gap-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition',
                      num <= step ? 'bg-[var(--color-primary)]' : 'bg-[var(--neutral-200)]'
                    )}
                  />
                  <span
                    className={cn(
                      'hidden text-[11px] font-medium sm:block',
                      num === step ? 'text-[var(--color-primary)]' : 'text-[var(--ishbor-text-muted)]'
                    )}
                  >
                    {stepTitles[num - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)]/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--ishbor-text-muted)]">
                    <Zap className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                    <span>{t('ai_assistant_hint')}</span>
                  </div>
                  <AiSuggestButton
                    kind="project_description"
                    context={{
                      title: formData.title,
                      category: formData.category,
                      skills: formData.skills,
                    }}
                    onApply={(text) => handleInputChange('description', text)}
                  />
                </div>

                <Input
                  label={t('project_title')}
                  placeholder={t('project_title_placeholder')}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={fieldErrors.title}
                />

                <Textarea
                  label={t('project_description')}
                  placeholder={t('description_placeholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={fieldErrors.description}
                  rows={5}
                  className="min-h-[120px]"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label={t('project_category')}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    options={categories.map((cat) => ({ value: cat.id, label: cat.label }))}
                    className="catalog-control"
                  />
                  <Select
                    label={t('experience_level')}
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    options={levels.map((level) => ({ value: level.id, label: level.label }))}
                    className="catalog-control"
                  />
                </div>

                <Input
                  label={t('skills')}
                  placeholder={t('skills_placeholder')}
                  className="catalog-control !h-[42px] border-[var(--ishbor-border)] bg-[var(--neutral-0)] shadow-[var(--shadow-xs)]"
                  onChange={(e) =>
                    handleInputChange('skills', e.target.value.split(',').map((s) => s.trim()))
                  }
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-[13px] font-medium text-[var(--ishbor-text-sub)]">
                    {t('budget_type')}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: 'fixed', label: t('fixed_price'), desc: t('total_cost') },
                      { id: 'hourly', label: t('hourly_label'), desc: t('pay_per_hour') },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleInputChange('budgetType', option.id)}
                        className={cn(
                          'rounded-xl border-2 p-4 text-left transition-[var(--transition)]',
                          formData.budgetType === option.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ishbor-border)] bg-[var(--neutral-0)] hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--ishbor-border))]'
                        )}
                      >
                        <div className="text-[14px] font-bold text-[var(--ishbor-text)]">{option.label}</div>
                        <div className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label={t('budget_amount')}
                  type="text"
                  inputMode="numeric"
                  placeholder={t('budget_placeholder')}
                  value={formData.budget}
                  onChange={(e) =>
                    handleInputChange('budget', e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  error={fieldErrors.budget}
                />

                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-[var(--color-text-sub)]">
                    {t('project_deadline')}
                  </p>
                  <p className="mb-3 text-[12px] text-[var(--ishbor-text-muted)]">
                    {t('project_deadline_hint')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DEADLINE_PRESETS.map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            'deadlineDays',
                            formData.deadlineDays === String(preset.days) ? '' : String(preset.days),
                          )
                        }
                        className={cn(
                          'rounded-xl border-2 px-3 py-3 text-center text-[13px] font-semibold transition-[var(--transition)]',
                          formData.deadlineDays === String(preset.days)
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ishbor-border)] bg-[var(--neutral-0)] text-[var(--ishbor-text)] hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--ishbor-border))]',
                        )}
                      >
                        {t(preset.labelKey)}
                      </button>
                    ))}
                  </div>
                  {deadlinePreview && (
                    <p className="mt-2.5 text-[13px] font-medium text-[var(--color-primary)]">
                      {deadlinePreview}
                    </p>
                  )}
                </div>

                <Select
                  label={t('preferred_city')}
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  options={cities.map((city) => ({ value: city, label: city }))}
                  className="catalog-control"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-[13px] font-medium text-[var(--ishbor-text-sub)]">
                    {t('attachments')}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleFiles(e.dataTransfer.files)
                    }}
                    className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--ishbor-border)] bg-[var(--neutral-50)] p-8 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--brand-50)]"
                  >
                    <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--ishbor-text-muted)]" />
                    <p className="font-semibold text-[var(--ishbor-text)]">
                      {uploading ? '...' : t('upload_files')}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">{t('drag_drop')}</p>
                    <p className="mt-2 text-[11px] text-[var(--ishbor-text-muted)]">{t('upload_formats_hint')}</p>
                  </div>
                  {uploadError && <p className="mt-2 text-[13px] text-[var(--error)]">{uploadError}</p>}
                  {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {attachments.map((file) => (
                        <div
                          key={file.url}
                          className="group relative overflow-hidden rounded-lg border border-[var(--ishbor-border)]"
                        >
                          <img src={file.url} alt={file.name} className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAttachment(file)}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                            aria-label={t('remove')}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="truncate p-1 text-[11px] text-[var(--ishbor-text-muted)]">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="settings-section-title mb-3">{t('preview')}</h3>
                  <Card className="border border-[var(--ishbor-border)] bg-[var(--neutral-50)] p-5">
                    <h4 className="mb-2 font-bold text-[var(--ishbor-text)]">
                      {formData.title || t('project_title_default')}
                    </h4>
                    <p className="mb-4 text-[13px] leading-relaxed text-[var(--ishbor-text-muted)]">
                      {formData.description || t('project_desc_default')}
                    </p>
                    <div className="flex items-center justify-between gap-4 border-t border-[var(--ishbor-border)] pt-4">
                      <div>
                        <p className="text-[11px] text-[var(--ishbor-text-muted)]">{t('project_budget')}</p>
                        <p className="font-bold text-[var(--color-primary)]">
                          {formatPrice(parseInt(formData.budget.replace(/\D/g, ''), 10) || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[var(--ishbor-text-muted)]">{t('project_deadline')}</p>
                        <p className="font-bold text-[var(--ishbor-text)]">
                          {deadlinePreview || t('not_set')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex flex-wrap gap-3 border-t border-[var(--ishbor-border)] pt-6">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevStep} className="flex-1 gap-2 sm:flex-none">
                  <ChevronLeft className="h-4 w-4" /> {t('back')}
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="outline"
                  onClick={() => void submitProject(true)}
                  disabled={submitting}
                  loading={submitting}
                  className="flex-1 sm:flex-none"
                >
                  {t('project_save_draft')}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={submitting}
                loading={submitting}
                className="flex-1 gap-2 sm:ml-auto"
              >
                {step === 3 ? t('post_project') : t('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
