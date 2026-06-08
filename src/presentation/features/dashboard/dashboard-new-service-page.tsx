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

  const stepLabels = [t('new_service_step1'), t('new_service_step2'), t('new_service_step3')]

  const parsePrice = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : 0
  }

  const handlePublish = async () => {
    const priceNum = parsePrice(price)
    const days = parseInt(deliveryDays, 10) || 5
    const parsed = serviceCreateSchema.safeParse({
      title,
      description,
      category,
      region,
      price: priceNum,
      delivery_days: days,
    })
    if (!parsed.success) {
      setError(t('error_required'))
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
      <div className="mb-6 flex items-center justify-center gap-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold',
                step > s
                  ? 'bg-[var(--success)] text-white'
                  : step === s
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'border border-[var(--kwork-border)] text-[var(--kwork-text-muted)]'
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={cn(
                'hidden text-[12px] sm:inline',
                step === s ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--kwork-text-muted)]'
              )}
            >
              {stepLabels[i]}
            </span>
          </div>
        ))}
      </div>

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('service_title_ph')}
            />
            <Select
              label={t('category')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('select')}
              options={KWORK_CATEGORY_ITEMS.map((c) => ({ value: c.cat, label: t(c.labelKey) }))}
            />
            <Textarea
              label={t('description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label={t('package_basic')}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150 000"
            />
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
            <Button
              variant="primary"
              fullWidth
              onClick={() => setStep((s) => (s + 1) as (typeof STEPS)[number])}
            >
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
