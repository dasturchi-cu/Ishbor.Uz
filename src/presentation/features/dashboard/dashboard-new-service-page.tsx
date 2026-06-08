'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { api } from '@/infrastructure/api/client'
import { uploadServiceImages } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { cn } from '@/shared/lib/utils'
import { serviceCreateSchema } from '@/domain/validators/service'
import type { TranslationKey } from '@/infrastructure/i18n'
import { toast } from '@/presentation/components/ui/toast'

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

const STEPS = [1, 2, 3] as const

export function DashboardNewServicePage() {
  const { t, userId, profile } = useApp()
  const router = useRouter()
  const [step, setStep] = useState<(typeof STEPS)[number]>(1)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('5')
  const [region, setRegion] = useState(profile?.region ?? UZ_REGIONS[0])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const stepLabels = [
    t('create_service_step_basic'),
    t('create_service_step_pricing'),
    t('create_service_step_media'),
  ]

  const parsePrice = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : 0
  }

  const fieldLabels: Record<string, string> = {
    title: t('service_title'),
    description: t('description'),
    category: t('category'),
    region: t('city'),
    price: t('package_basic'),
    delivery_days: t('delivery_time'),
  }

  const collectFieldErrors = (
    data: {
      title: string
      description: string
      category: string
      region: string
      price: number
      delivery_days: number
    },
    onlyFields?: string[]
  ) => {
    const parsed = serviceCreateSchema.safeParse(data)
    if (parsed.success) {
      setFieldErrors({})
      return true
    }
    const next: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (!key || next[key]) continue
      if (onlyFields && !onlyFields.includes(key)) continue
      const label = fieldLabels[key] ?? key
      if (issue.code === 'too_small' && key !== 'price' && key !== 'delivery_days') {
        next[key] = formatFieldError(t, label, 'min', Number(issue.minimum))
      } else if (issue.code === 'too_small') {
        next[key] = formatFieldError(t, label, 'required')
      } else {
        next[key] = formatFieldError(t, label, 'required')
      }
    }
    setFieldErrors(next)
    const first = Object.values(next)[0]
    if (first) toast.error(first)
    return false
  }

  const handleNext = () => {
    if (step === 1) {
      const ok = collectFieldErrors(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          region,
          price: 1,
          delivery_days: 5,
        },
        ['title', 'description', 'category']
      )
      if (!ok) return
    }
    if (step === 2) {
      const priceNum = parsePrice(price)
      const days = parseInt(deliveryDays, 10) || 5
      const ok = collectFieldErrors(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          region,
          price: priceNum,
          delivery_days: days,
        },
        ['price', 'delivery_days', 'region']
      )
      if (!ok) return
    }
    setStep((s) => (s + 1) as (typeof STEPS)[number])
  }

  const handlePublish = async () => {
    const priceNum = parsePrice(price)
    const days = parseInt(deliveryDays, 10) || 5
    if (
      !collectFieldErrors({
        title: title.trim(),
        description: description.trim(),
        category,
        region,
        price: priceNum,
        delivery_days: days,
      })
    ) {
      return
    }
    setPublishing(true)
    setError('')
    try {
      let urls = imageUrls
      if (mediaFiles.length > 0 && userId && isSupabaseConfigured()) {
        setUploading(true)
        urls = await uploadServiceImages(mediaFiles, userId)
        setImageUrls(urls)
        setUploading(false)
      }
      const safeDays = Math.min(365, Math.max(1, days))
      await api.createService({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        region,
        image_urls: urls,
        delivery_days: safeDays,
        packages: [
          { id: 'basic', label_key: 'package_basic', price: priceNum, delivery_days: safeDays },
          {
            id: 'standard',
            label_key: 'package_standard',
            price: Math.round(priceNum * 1.5),
            delivery_days: Math.max(1, safeDays - 1),
          },
          {
            id: 'premium',
            label_key: 'package_premium',
            price: Math.round(priceNum * 2.2),
            delivery_days: Math.max(1, safeDays - 2),
          },
        ],
      })
      router.push(`${PATHS.dashboardFreelancer}?created=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setPublishing(false)
      setUploading(false)
    }
  }

  return (
    <div>
      <ol className="service-wizard-stepper mb-6 flex items-center justify-center">
        {STEPS.map((s, i) => {
          const done = step > s
          const active = step === s
          return (
            <li key={s} className="service-wizard-stepper__item flex items-center">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'service-wizard-stepper__badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                    done && 'bg-[var(--success)] text-white',
                    active && 'bg-[var(--color-primary)] text-white shadow-[0_0_0_3px_rgba(37,99,235,0.18)]',
                    !done && !active && 'border border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text-muted)]'
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : s}
                </span>
                <span
                  className={cn(
                    'service-wizard-stepper__label hidden text-[13px] font-medium sm:inline',
                    active && 'font-semibold text-[var(--color-primary)]',
                    done && 'text-[var(--kwork-text)]',
                    !done && !active && 'text-[var(--kwork-text-muted)]'
                  )}
                >
                  {stepLabels[i]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    'service-wizard-stepper__line mx-3 hidden h-px w-8 sm:block md:w-12',
                    done ? 'bg-[var(--success)]' : 'bg-[var(--kwork-border)]'
                  )}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>

      <div className="mx-auto max-w-[640px] rounded-[var(--r-card)] border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5 sm:p-6">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label={t('service_title')}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setFieldErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder={t('service_title_ph')}
              error={fieldErrors.title}
            />
            <Select
              label={t('category')}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setFieldErrors((prev) => ({ ...prev, category: '' }))
              }}
              placeholder={t('select')}
              options={KWORK_CATEGORY_ITEMS.map((c) => ({ value: c.cat, label: t(c.labelKey) }))}
            />
            <Textarea
              label={t('description')}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setFieldErrors((prev) => ({ ...prev, description: '' }))
              }}
              rows={8}
              error={fieldErrors.description}
              hint={t('description_min_hint')}
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label={t('package_basic')}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value)
                setFieldErrors((prev) => ({ ...prev, price: '' }))
              }}
              placeholder={t('price_placeholder')}
              error={fieldErrors.price}
            />
            <Input
              label={t('delivery_time')}
              type="number"
              min={1}
              max={365}
              value={deliveryDays}
              onChange={(e) => {
                setDeliveryDays(e.target.value)
                setFieldErrors((prev) => ({ ...prev, delivery_days: '' }))
              }}
              hint={t('delivery_days_hint')}
              rightIcon={
                <span className="text-[12px] font-semibold text-[var(--kwork-text-muted)]">
                  {t('delivery_days_unit')}
                </span>
              }
              error={fieldErrors.delivery_days}
            />
            <Select
              label={t('city')}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
              placeholder={t('select')}
            />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <FileUploadZone
              maxFiles={4}
              initialUrls={imageUrls}
              disabled={uploading || publishing}
              onFilesChange={setMediaFiles}
              onUpload={
                userId && isSupabaseConfigured()
                  ? async (files) => {
                      setUploading(true)
                      try {
                        const urls = await uploadServiceImages(files, userId)
                        setImageUrls(urls)
                        return urls
                      } finally {
                        setUploading(false)
                      }
                    }
                  : undefined
              }
            />
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as (typeof STEPS)[number])}
            >
              {t('back')}
            </Button>
          )}
          {step < 3 ? (
            <Button variant="primary" fullWidth onClick={handleNext}>
              {t('next')}
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={handlePublish}
              loading={publishing || uploading}
            >
              {t('publish_service')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
