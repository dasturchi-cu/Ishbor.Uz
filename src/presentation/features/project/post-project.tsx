'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Card } from '@/presentation/components/ui/card'
import { PATHS } from '@/domain/constants/routes'
import { ChevronRight, ChevronLeft, Upload, Zap, X } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { api, ApiError } from '@/infrastructure/api/client'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { uploadProjectImage, removeProjectImage } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { TranslationKey } from '@/infrastructure/i18n'

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
  const { t, userId } = useApp()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
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
  })
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

  const validateAll = (): Record<string, string> => ({
    ...validateStep1(),
    ...validateStep2(),
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return
    if (!isSupabaseConfigured()) {
      setUploadError('Supabase sozlanmagan')
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
      setUploadError(e instanceof Error ? e.message : 'Yuklash xatosi')
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
      })
      router.push(PATHS.dashboardClient)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapAuthErrorMessage(e.message, t))
      } else {
        setError(e instanceof Error ? e.message : 'Xatolik')
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

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex-1 h-1 rounded-full transition ${
                  num <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-2 text-foreground">{t('post_your_project')}</h1>
          <p className="text-muted-foreground mb-8">{t('step_of')} {step} {t('of')} 3</p>

          {step === 1 && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mb-6">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm text-primary font-semibold">{t('ai_assistant_hint')}</span>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('project_title')}</label>
                <Input
                  placeholder={t('project_title_placeholder')}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.title)}
                />
                {fieldErrors.title && (
                  <p className="text-sm text-destructive mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('project_description')}</label>
                <textarea
                  placeholder={t('description_placeholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none h-32"
                  aria-invalid={Boolean(fieldErrors.description)}
                />
                {fieldErrors.description && (
                  <p className="text-sm text-destructive mt-1">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">{t('project_category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">{t('experience_level')}</label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('skills')}</label>
                <Input
                  placeholder={t('skills_placeholder')}
                  onChange={(e) => handleInputChange('skills', e.target.value.split(',').map((s) => s.trim()))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-3">{t('budget_type')}</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'fixed', label: t('fixed_price'), desc: t('total_cost') },
                    { id: 'hourly', label: t('hourly_label'), desc: t('pay_per_hour') },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleInputChange('budgetType', option.id)}
                      className={`p-4 border-2 rounded-lg transition ${
                        formData.budgetType === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-bold text-foreground">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('budget_amount')}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('budget_placeholder')}
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  aria-invalid={Boolean(fieldErrors.budget)}
                />
                {fieldErrors.budget && (
                  <p className="text-sm text-destructive mt-1">{fieldErrors.budget}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('project_deadline')}</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('preferred_city')}</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">{t('attachments')}</label>
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
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleFiles(e.dataTransfer.files)
                  }}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition cursor-pointer"
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold text-foreground mb-1">
                    {uploading ? '...' : t('upload_files')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('drag_drop')}</p>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP, GIF — max 5 MB</p>
                </div>
                {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {attachments.map((file) => (
                      <div key={file.url} className="relative group rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={file.url} alt={file.name} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAttachment(file)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                          aria-label={t('remove')}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs p-1 truncate text-muted-foreground">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-foreground">{t('visible_to_all')}</span>
                </label>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-4">{t('preview')}</h3>
                <Card className="p-6 bg-secondary">
                  <h4 className="font-bold text-foreground mb-2">{formData.title || t('project_title_default')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{formData.description || t('project_desc_default')}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('project_budget')}</p>
                      <p className="font-bold text-foreground">{formData.budget || '0'} so'm</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('project_deadline')}</p>
                      <p className="font-bold text-foreground">{formData.deadline || t('not_set')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 gap-2">
                <ChevronLeft className="h-4 w-4" /> {t('back')}
              </Button>
            )}
            <Button onClick={handleNextStep} disabled={submitting} className="flex-1 gap-2">
              {submitting ? '...' : step === 3 ? t('post_project') : t('next')} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
