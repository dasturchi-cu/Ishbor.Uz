'use client'

import React, { useEffect, useRef, useState } from 'react'
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
import { useFormDraft } from '@/shared/lib/use-form-draft'
import { postProjectSchema } from '@/domain/validators/project'
import { toast } from '@/presentation/components/ui/toast'

type UploadedFile = { url: string; name: string }

const MAX_BUDGET = 2_147_483_647

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
  const { t, userId, isLoggedIn, isAuthLoading } = useApp()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const initialForm = {
    title: '',
    description: '',
    category: 'design',
    skills: [] as string[],
    budget: '',
    budgetType: 'fixed',
    deadline: '',
    level: 'intermediate',
    city: 'Toshkent shahri',
    visibility: 'public',
  }
  const [formData, setFormData] = useState(initialForm)
  const draft = useFormDraft('ishbor-post-project-draft', formData)

  useEffect(() => {
    const restored = draft.hydrate(initialForm)
    if (restored.title || restored.description || restored.budget) {
      setFormData(restored)
      toast.info(t('draft_restored'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
    if (!formData.title.trim()) {
      errs.title = formatFieldError(t, t('project_title'), 'required')
    }
    if (formData.description.trim().length < 10) {
      errs.description = formatFieldError(t, t('project_description'), 'min')
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
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'title' && !errs.title) errs.title = formatFieldError(t, t('project_title'), 'required')
        if (key === 'description' && !errs.description) {
          errs.description = formatFieldError(t, t('project_description'), 'min')
        }
        if (key === 'budget' && !errs.budget) errs.budget = formatFieldError(t, t('budget_amount'), 'required')
        if (key === 'category' && !errs.category) errs.category = formatFieldError(t, t('category'), 'required')
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
      await api.createProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        skills: formData.skills,
        budget,
        budget_type: formData.budgetType,
        deadline: formData.deadline || null,
        level: formData.level,
        region: formData.city,
        attachment_urls: attachments.map((a) => a.url),
        is_public: formData.visibility !== 'private',
      })
      draft.clear()
      router.push(`${PATHS.dashboardProjects}?posted=1`)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapAuthErrorMessage(e.message, t))
      } else {
        setError(e instanceof Error ? e.message : t('error_generic'))
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

  if (isAuthLoading || !isLoggedIn) {
    return <div className="flex min-h-[40vh] items-center justify-center">...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--kwork-header-h))] bg-[var(--neutral-50)] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="surface-panel overflow-hidden">
          <div className="border-b border-[var(--kwork-border)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--neutral-0)] px-6 py-6 sm:px-8">
            <h1 className="text-[22px] font-bold text-[var(--kwork-text)] sm:text-[24px]">
              {t('post_your_project')}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">
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
                      num === step ? 'text-[var(--color-primary)]' : 'text-[var(--kwork-text-muted)]'
                    )}
                  >
                    {stepTitles[num - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            {step === 1 && (
              <div className="space-y-5">
                <div className="feature-pill feature-pill-blue w-full justify-center py-3 sm:justify-start">
                  <Zap className="h-4 w-4 shrink-0" />
                  <span>{t('ai_assistant_hint')}</span>
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
                  className="catalog-control !h-[42px] border-[var(--kwork-border)] bg-[var(--neutral-0)] shadow-[var(--shadow-xs)]"
                  onChange={(e) =>
                    handleInputChange('skills', e.target.value.split(',').map((s) => s.trim()))
                  }
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-[13px] font-medium text-[var(--kwork-text-sub)]">
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
                            : 'border-[var(--kwork-border)] bg-[var(--neutral-0)] hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--kwork-border))]'
                        )}
                      >
                        <div className="text-[14px] font-bold text-[var(--kwork-text)]">{option.label}</div>
                        <div className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{option.desc}</div>
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

                <Input
                  label={t('project_deadline')}
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />

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
                  <p className="mb-2 text-[13px] font-medium text-[var(--kwork-text-sub)]">
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
                    className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--kwork-border)] bg-[var(--neutral-50)] p-8 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--brand-50)]"
                  >
                    <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--kwork-text-muted)]" />
                    <p className="font-semibold text-[var(--kwork-text)]">
                      {uploading ? '...' : t('upload_files')}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{t('drag_drop')}</p>
                    <p className="mt-2 text-[11px] text-[var(--kwork-text-muted)]">{t('upload_formats_hint')}</p>
                  </div>
                  {uploadError && <p className="mt-2 text-[13px] text-[var(--error)]">{uploadError}</p>}
                  {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {attachments.map((file) => (
                        <div
                          key={file.url}
                          className="group relative overflow-hidden rounded-lg border border-[var(--kwork-border)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={file.url} alt={file.name} className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAttachment(file)}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                            aria-label={t('remove')}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="truncate p-1 text-[11px] text-[var(--kwork-text-muted)]">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--kwork-border)] bg-[var(--neutral-50)] px-4 py-3">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" />
                  <span className="text-[13px] text-[var(--kwork-text)]">{t('visible_to_all')}</span>
                </label>

                <div>
                  <h3 className="settings-section-title mb-3">{t('preview')}</h3>
                  <Card className="border border-[var(--kwork-border)] bg-[var(--neutral-50)] p-5">
                    <h4 className="mb-2 font-bold text-[var(--kwork-text)]">
                      {formData.title || t('project_title_default')}
                    </h4>
                    <p className="mb-4 text-[13px] leading-relaxed text-[var(--kwork-text-muted)]">
                      {formData.description || t('project_desc_default')}
                    </p>
                    <div className="flex items-center justify-between gap-4 border-t border-[var(--kwork-border)] pt-4">
                      <div>
                        <p className="text-[11px] text-[var(--kwork-text-muted)]">{t('project_budget')}</p>
                        <p className="font-bold text-[var(--color-primary)]">
                          {formData.budget || '0'} so&apos;m
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[var(--kwork-text-muted)]">{t('project_deadline')}</p>
                        <p className="font-bold text-[var(--kwork-text)]">
                          {formData.deadline || t('not_set')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex gap-3 border-t border-[var(--kwork-border)] pt-6">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevStep} className="flex-1 gap-2">
                  <ChevronLeft className="h-4 w-4" /> {t('back')}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={submitting}
                className="flex-1 gap-2"
              >
                {submitting ? '...' : step === 3 ? t('post_project') : t('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
