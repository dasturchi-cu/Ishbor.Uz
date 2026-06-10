'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { Button } from '@/presentation/components/ui/button'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { PATHS } from '@/domain/constants/routes'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { api } from '@/infrastructure/api/client'
import { toast } from '@/presentation/components/ui/toast'
import { captureLoadError } from '@/shared/lib/load-error'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { uploadServiceImages } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { serviceCreateSchema } from '@/domain/validators/service'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { useServerDraft } from '@/shared/lib/use-server-draft'
import { ServicePackagesEditor } from '@/presentation/components/dashboard/service-packages-editor'
import { buildDefaultPackages, normalizePackages } from '@/shared/lib/service-packages'
import { formatServiceIncludesText, parseServiceIncludesText } from '@/shared/lib/service-includes'
import { formatServiceFaqText, parseServiceFaqText } from '@/shared/lib/service-faq'
import type { ApiServicePackage } from '@/infrastructure/api/types'

export function DashboardEditServicePage({ serviceId }: { serviceId: string }) {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [includesText, setIncludesText] = useState('')
  const [faqText, setFaqText] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('5')
  const [region, setRegion] = useState(profile?.region ?? UZ_REGIONS[0])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [packages, setPackages] = useState<ApiServicePackage[]>(buildDefaultPackages(0, 5))
  const [serviceLoaded, setServiceLoaded] = useState(false)
  const draftHydrated = useRef(false)

  const draftPayload = useMemo(
    () => ({
      title,
      category,
      description,
      includesText,
      faqText,
      price,
      deliveryDays,
      region,
      imageUrls,
      packages,
    }),
    [title, category, description, includesText, faqText, price, deliveryDays, region, imageUrls, packages]
  )

  const draft = useServerDraft(`edit-service-${serviceId}`, draftPayload, serviceLoaded, (remote) => {
    if (draftHydrated.current) return
    if (!remote.title && !remote.description) return
    draftHydrated.current = true
    if (typeof remote.title === 'string') setTitle(remote.title)
    if (typeof remote.category === 'string') setCategory(remote.category)
    if (typeof remote.description === 'string') setDescription(remote.description)
    if (typeof remote.includesText === 'string') setIncludesText(remote.includesText)
    if (typeof remote.faqText === 'string') setFaqText(remote.faqText)
    if (typeof remote.price === 'string') setPrice(remote.price)
    if (typeof remote.deliveryDays === 'string') setDeliveryDays(remote.deliveryDays)
    if (typeof remote.region === 'string') setRegion(remote.region)
    if (Array.isArray(remote.imageUrls)) setImageUrls(remote.imageUrls as string[])
    if (Array.isArray(remote.packages)) setPackages(remote.packages as ApiServicePackage[])
    toast.info(t('draft_restored'))
  })

  useAuthedEffect(() => {
    setLoading(true)
    api
      .getService(serviceId)
      .then((s) => {
        setTitle(s.title)
        setCategory(s.category)
        setDescription(s.description)
        setIncludesText(formatServiceIncludesText(s.includes))
        setFaqText(formatServiceFaqText(s.faq))
        setPrice(String(s.price))
        setDeliveryDays(String(s.delivery_days ?? 5))
        setRegion(s.region)
        setImageUrls(s.image_urls ?? [])
        setPackages(
          normalizePackages(s.packages, s.price, s.delivery_days ?? 5)
        )
        setServiceLoaded(true)
        if (!draftHydrated.current) {
          draftHydrated.current = true
          const restored = draft.hydrate({
            title: s.title,
            category: s.category,
            description: s.description,
            includesText: formatServiceIncludesText(s.includes),
            faqText: formatServiceFaqText(s.faq),
            price: String(s.price),
            deliveryDays: String(s.delivery_days ?? 5),
            region: s.region,
            imageUrls: s.image_urls ?? [],
            packages: normalizePackages(s.packages, s.price, s.delivery_days ?? 5),
          }) as typeof draftPayload
          if (
            restored.title !== s.title ||
            restored.description !== s.description ||
            restored.includesText !== formatServiceIncludesText(s.includes) ||
            restored.faqText !== formatServiceFaqText(s.faq) ||
            restored.price !== String(s.price)
          ) {
            setTitle(restored.title)
            setCategory(restored.category)
            setDescription(restored.description)
            if (typeof restored.includesText === 'string') setIncludesText(restored.includesText)
            if (typeof restored.faqText === 'string') setFaqText(restored.faqText)
            setPrice(restored.price)
            setDeliveryDays(restored.deliveryDays)
            setRegion(restored.region)
            if (Array.isArray(restored.imageUrls)) setImageUrls(restored.imageUrls)
            if (Array.isArray(restored.packages)) setPackages(restored.packages)
          }
        }
      })
      .catch((e) => toast.error(captureLoadError(e, { scope: 'services', apiPath: `/api/v1/services/${serviceId}` }, t)))
      .finally(() => setLoading(false))
  }, [serviceId, t, draft])

  const parsePrice = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : 0
  }

  const handleSave = async () => {
    const basicPkg = packages.find((p) => p.id === 'basic')
    const priceNum = basicPkg?.price && basicPkg.price > 0 ? basicPkg.price : parsePrice(price)
    const safeDays =
      basicPkg?.delivery_days && basicPkg.delivery_days > 0
        ? basicPkg.delivery_days
        : Math.min(365, Math.max(1, parseInt(deliveryDays, 10) || 5))
    const parsed = serviceCreateSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      category,
      region,
      price: priceNum,
      delivery_days: safeDays,
      includes: parseServiceIncludesText(includesText),
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key) next[key] = t('error_required')
      }
      setErrors(next)
      toast.error(t('error_required'))
      return
    }
    setErrors({})
    setSaving(true)
    try {
      let urls = imageUrls
      if (mediaFiles.length > 0 && userId && isSupabaseConfigured()) {
        const uploaded = await uploadServiceImages(mediaFiles, userId)
        urls = [...urls, ...uploaded]
      }
      await api.updateService(serviceId, {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        region,
        image_urls: urls,
        delivery_days: safeDays,
        packages,
        includes: parseServiceIncludesText(includesText),
        faq: parseServiceFaqText(faqText),
      })
      draft.clear()
      toast.success(t('service_updated'))
      router.push(PATHS.dashboardServices)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <h2 className="dashboard-page-title mb-4">{t('edit_service')}</h2>
      <div className="space-y-4 rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5">
        <Input label={t('service_title')} value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
        <Select
          label={t('category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={KWORK_CATEGORY_ITEMS.map((c) => ({ value: c.cat, label: t(c.labelKey) }))}
          error={errors.category}
        />
        <Textarea label={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={6} error={errors.description} />
        <Textarea
          label={t('service_includes_title')}
          value={includesText}
          onChange={(e) => setIncludesText(e.target.value)}
          rows={5}
          error={errors.includes}
          hint={t('service_includes_hint')}
          placeholder={t('service_includes_ph')}
        />
        <Textarea
          label={t('service_faq')}
          value={faqText}
          onChange={(e) => setFaqText(e.target.value)}
          rows={6}
          hint={t('service_faq_hint')}
          placeholder={t('service_faq_ph')}
        />
        <ServicePackagesEditor
          packages={packages}
          onChange={(next) => {
            setPackages(next)
            const basic = next.find((p) => p.id === 'basic')
            if (basic) {
              setPrice(String(basic.price))
              setDeliveryDays(String(basic.delivery_days))
            }
          }}
          onResetSuggested={() => {
            const next = buildDefaultPackages(parsePrice(price) || 0, parseInt(deliveryDays, 10) || 5)
            setPackages(next)
            setPrice(String(next[0]?.price ?? 0))
            setDeliveryDays(String(next[0]?.delivery_days ?? 5))
          }}
          disabled={saving}
        />
        <Select
          label={t('city')}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
        />
        <FileUploadZone initialUrls={imageUrls} onFilesChange={setMediaFiles} />
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => router.push(PATHS.dashboardServices)}>
            {t('cancel')}
          </Button>
          <Button variant="primary" fullWidth loading={saving} onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
