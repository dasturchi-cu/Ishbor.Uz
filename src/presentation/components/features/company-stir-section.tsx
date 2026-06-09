'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { api } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { uploadProjectImage } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'

export function CompanyStirSection() {
  const { t, userId } = useApp()
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [stir, setStir] = useState('')
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api
      .listMyCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }, [])

  useAuthedEffect(() => {
    load()
  }, [load])

  const company = companies[0]

  useEffect(() => {
    if (!company) return
    setStir(company.stir ?? '')
    setDocUrl(company.stir_document_url ?? null)
  }, [company])

  const submit = async () => {
    if (!company) return
    const digits = stir.replace(/\D/g, '')
    if (digits.length < 9 || digits.length > 14) {
      toast.error(t('stir_invalid'))
      return
    }
    setSubmitting(true)
    try {
      const updated = await api.submitCompanyStir(company.id, digits, docUrl ?? undefined)
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      toast.success(t('stir_submitted'))
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'company_stir' }, t))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
  }

  if (!company) {
    return (
      <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('stir_no_company')}</p>
    )
  }

  const canEdit = !company.stir_verified

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-semibold text-[var(--ishbor-text)]">{company.name}</p>
        {company.stir_verified ? (
          <Badge variant="success" size="xs">
            {t('stir_verified_badge')}
          </Badge>
        ) : company.stir ? (
          <Badge variant="warning" size="xs">
            {t('stir_pending_badge')}
          </Badge>
        ) : null}
      </div>

      {canEdit ? (
        <>
          <Input
            label={t('stir_number_label')}
            value={stir}
            onChange={(e) => setStir(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder={t('stir_number_ph')}
            inputMode="numeric"
            className="max-w-[320px]"
          />
          {userId && isSupabaseConfigured() && (
            <div className="max-w-[420px]">
              <p className="mb-2 text-[13px] font-medium text-[var(--ishbor-text)]">{t('stir_document_label')}</p>
              <FileUploadZone
                maxFiles={1}
                maxSizeMb={5}
                initialUrls={docUrl ? [docUrl] : []}
                disabled={uploading}
                onUpload={async (files) => {
                  if (!files[0] || !userId) return []
                  setUploading(true)
                  try {
                    const url = await uploadProjectImage(files[0], userId)
                    setDocUrl(url)
                    return [url]
                  } catch (e) {
                    toast.error(captureActionError(e, { scope: 'company_stir' }, t))
                    return []
                  } finally {
                    setUploading(false)
                  }
                }}
              />
            </div>
          )}
          <Button variant="primary" size="sm" loading={submitting} onClick={() => void submit()}>
            {t('stir_submit')}
          </Button>
        </>
      ) : (
        <p className="text-[13px] text-[var(--ishbor-text-muted)]">
          {t('stir_number_label')}: <span className="font-semibold text-[var(--ishbor-text)]">{company.stir}</span>
        </p>
      )}
    </div>
  )
}
