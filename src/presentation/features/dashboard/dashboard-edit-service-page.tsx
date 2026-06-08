'use client'

import { useEffect, useState } from 'react'
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
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { uploadServiceImages } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'

export function DashboardEditServicePage({ serviceId }: { serviceId: string }) {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('5')
  const [region, setRegion] = useState(profile?.region ?? UZ_REGIONS[0])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getService(serviceId)
      .then((s) => {
        setTitle(s.title)
        setCategory(s.category)
        setDescription(s.description)
        setPrice(String(s.price))
        setDeliveryDays(String(s.delivery_days ?? 5))
        setRegion(s.region)
        setImageUrls(s.image_urls ?? [])
      })
      .catch(() => toast.error(t('error_required')))
      .finally(() => setLoading(false))
  }, [serviceId, t])

  const parsePrice = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : 0
  }

  const handleSave = async () => {
    const priceNum = parsePrice(price)
    if (!title.trim() || !category || !description.trim() || priceNum <= 0) {
      toast.error(t('error_required'))
      return
    }
    const safeDays = Math.min(365, Math.max(1, parseInt(deliveryDays, 10) || 5))
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
      <div className="space-y-4 rounded-[var(--r-card)] border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5">
        <Input label={t('service_title')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select
          label={t('category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={KWORK_CATEGORY_ITEMS.map((c) => ({ value: c.cat, label: t(c.labelKey) }))}
        />
        <Textarea label={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        <Input label={t('package_basic')} value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input
          label={t('delivery_time')}
          type="number"
          min={1}
          max={365}
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(e.target.value)}
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
