'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { api, ApiError } from '@/infrastructure/api/client'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { PATHS, dashboardPathForRole } from '@/domain/constants/routes'
import { UZ_REGIONS, type UzRegion } from '@/domain/constants/regions'
import type { TranslationKey } from '@/infrastructure/i18n'
import { useFormDraft } from '@/shared/lib/use-form-draft'
import { toast } from '@/presentation/components/ui/toast'
import { serviceCreateSchema } from '@/domain/validators/service'
import { cn } from '@/shared/lib/utils'

const DELIVERY_PRESETS = [3, 5, 7, 14, 30] as const

type ServiceForm = {
  title: string
  description: string
  price: string
  deliveryDays: string
  category: string
  region: UzRegion
}

const CREATE_SERVICE_INITIAL_FORM: ServiceForm = {
  title: '',
  description: '',
  price: '',
  deliveryDays: '5',
  category: 'web',
  region: UZ_REGIONS[0],
}

const TITLE_MAX = 200
const MAX_PRICE = 2_147_483_647

function sanitizeTitle(value: string): string {
  if (value.startsWith('data:')) return ''
  return value.slice(0, TITLE_MAX)
}

function isInvalidTitle(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('data:')) return true
  if (trimmed.includes('base64,')) return true
  return trimmed.length > TITLE_MAX
}

function parseApiError(e: unknown, translate: (key: TranslationKey) => string): string {
  if (!(e instanceof ApiError)) {
    return e instanceof Error ? e.message : translate('error_required')
  }
  const raw = e.message
  try {
    const parsed = JSON.parse(raw) as Array<{ msg?: string }>
    if (Array.isArray(parsed) && parsed[0]?.msg) return parsed[0].msg
  } catch {
    // not JSON validation detail
  }
  return mapAuthErrorMessage(raw, translate)
}

export function CreateServicePage() {
  const { t, isAuthLoading, refreshProfile, currentUserRole } = useApp()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<ServiceForm>(CREATE_SERVICE_INITIAL_FORM)
  const draft = useFormDraft('ishbor-create-service-draft', form)
  const draftHydrated = useRef(false)

  useEffect(() => {
    if (draftHydrated.current) return
    draftHydrated.current = true
    const restored = draft.hydrate(CREATE_SERVICE_INITIAL_FORM)
    if (restored.title || restored.description || restored.price) {
      setForm(restored)
      toast.info(t('draft_restored'))
    }
  }, [draft, t])

  useEffect(() => {
    if (isAuthLoading) return
    if (currentUserRole === 'client') {
      router.replace(PATHS.dashboardClient)
    }
  }, [isAuthLoading, currentUserRole, router])

  const updateField = <K extends keyof ServiceForm>(field: K, value: ServiceForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field] && !prev.submit) return prev
      const next = { ...prev }
      delete next[field]
      delete next.submit
      return next
    })
  }

  const handleTitleChange = (value: string) => {
    updateField('title', sanitizeTitle(value))
  }

  const handleTitlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted.startsWith('data:') || pasted.includes('base64,')) {
      e.preventDefault()
      setErrors((prev) => ({ ...prev, title: t('error_title_invalid') }))
    }
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()

    const price = parseInt(form.price.replace(/\D/g, ''), 10)
    const title = form.title.trim()
    if (isInvalidTitle(title)) {
      setErrors({ title: t('error_title_invalid') })
      return
    }
    const days = parseInt(form.deliveryDays, 10) || 5
    const parsed = serviceCreateSchema.safeParse({
      title,
      description: form.description,
      category: form.category,
      region: form.region,
      price,
      delivery_days: days,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key === 'title') next.title = t('error_required')
        else if (key === 'description') next.description = t('error_required')
        else if (key === 'category') next.category = t('error_required')
        else if (key === 'region') next.region = t('error_required')
        else if (key === 'price') next.price = t('error_required')
      }
      setErrors(Object.keys(next).length > 0 ? next : { submit: t('error_required') })
      return
    }
    if (price > MAX_PRICE) {
      setErrors({ price: t('error_price_too_large') })
      return
    }
    const safeDays = Math.min(365, Math.max(1, days))

    setLoading(true)
    try {
      await api.createService({
        title,
        description: form.description.trim(),
        price,
        category: form.category,
        region: form.region,
        delivery_days: safeDays,
        packages: [
          { id: 'basic', label_key: 'package_basic', price, delivery_days: safeDays },
          {
            id: 'standard',
            label_key: 'package_standard',
            price: Math.round(price * 1.5),
            delivery_days: Math.max(1, safeDays - 1),
          },
          {
            id: 'premium',
            label_key: 'package_premium',
            price: Math.round(price * 2.2),
            delivery_days: Math.max(1, safeDays - 2),
          },
        ],
      })
      draft.clear()
      await refreshProfile()
      router.replace(`${dashboardPathForRole('freelancer')}?created=1`)
    } catch (err) {
      setErrors({ submit: parseApiError(err, t) })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
        {t('creating')}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Card className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('create_service_title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('create_service_desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {errors.submit && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{errors.submit}</p>
          )}

          <div>
            <label htmlFor="service-title" className="text-sm font-semibold block mb-2">
              {t('service_title')}
            </label>
            <Input
              id="service-title"
              name="service-title"
              type="text"
              autoComplete="off"
              maxLength={TITLE_MAX}
              placeholder={t('service_title_ph')}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onPaste={handleTitlePaste}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="service-description" className="text-sm font-semibold block mb-2">
              {t('project_description')}
            </label>
            <textarea
              id="service-description"
              name="service-description"
              autoComplete="off"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-28"
              aria-invalid={Boolean(errors.description)}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('description_min_hint')}</p>
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="service-delivery" className="text-sm font-semibold block mb-2">
              {t('delivery_time')}
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {DELIVERY_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => updateField('deliveryDays', String(days))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[13px] font-medium transition',
                    form.deliveryDays === String(days)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text-muted)] hover:border-[var(--color-primary)]'
                  )}
                >
                  {t('service_delivery_days').replace('{n}', String(days))}
                </button>
              ))}
            </div>
            <Input
              id="service-delivery"
              name="service-delivery"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('delivery_days_ph')}
              value={form.deliveryDays}
              onChange={(e) => updateField('deliveryDays', e.target.value.replace(/\D/g, '').slice(0, 3))}
              hint={t('delivery_days_hint')}
              rightIcon={
                <span className="text-[12px] font-semibold text-[var(--kwork-text-muted)]">
                  {t('delivery_days_unit')}
                </span>
              }
            />
          </div>

          <div>
            <label htmlFor="service-price" className="text-sm font-semibold block mb-2">
              {t('price')} (so&apos;m)
            </label>
            <Input
              id="service-price"
              name="service-price"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('price_placeholder')}
              value={form.price}
              onChange={(e) => updateField('price', e.target.value.replace(/\D/g, '').slice(0, 10))}
              aria-invalid={Boolean(errors.price)}
            />
            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="service-category" className="text-sm font-semibold block mb-2">
              {t('category')}
            </label>
            <select
              id="service-category"
              name="service-category"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="web">{t('cat_web')}</option>
              <option value="mobile">{t('cat_mobile')}</option>
              <option value="uiux">{t('cat_uiux')}</option>
              <option value="graphic">{t('cat_graphic')}</option>
              <option value="writing">{t('cat_writing')}</option>
              <option value="video">{t('cat_video')}</option>
              <option value="seo">{t('cat_seo')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="service-region" className="text-sm font-semibold block mb-2">
              {t('region')}
            </label>
            <select
              id="service-region"
              name="service-region"
              value={form.region}
              onChange={(e) => updateField('region', e.target.value as UzRegion)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              {UZ_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('creating') : t('btn_create_service')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
