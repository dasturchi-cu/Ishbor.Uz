'use client'

import { useCallback, useState } from 'react'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { Badge } from '@/presentation/components/ui/badge'
import { api } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { slugifyName } from '@/shared/lib/slug'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { captureLoadError } from '@/shared/lib/load-error'

export function CompanySelfServiceSection() {
  const { t } = useApp()
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [region, setRegion] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .listMyCompanies()
      .then((rows) => {
        setCompanies(rows)
        const c = rows[0]
        if (c) {
          setName(c.name)
          setSlug(c.slug)
          setDescription(c.description ?? '')
          setWebsite(c.website ?? '')
          setRegion(c.region ?? '')
        }
      })
      .catch((e) => {
        setCompanies([])
        toast.error(captureLoadError(e, { scope: 'companies', apiPath: '/api/v1/companies/mine' }, t))
      })
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    load()
  }, [load])

  const company = companies[0]

  const handleNameChange = (value: string) => {
    setName(value)
    if (!company) {
      setSlug(slugifyName(value))
    }
  }

  const save = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error(t('error_title_short'))
      return
    }
    setSaving(true)
    try {
      if (company) {
        const updated = await api.updateMyCompany(company.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          website: website.trim() || undefined,
          region: region || undefined,
        })
        setCompanies([updated])
        toast.success(t('company_updated_success'))
      } else {
        const slugValue = (slug.trim() || slugifyName(name)).toLowerCase()
        const created = await api.createMyCompany({
          name: name.trim(),
          slug: slugValue,
          description: description.trim() || undefined,
          website: website.trim() || undefined,
          region: region || undefined,
        })
        setCompanies([created])
        setSlug(created.slug)
        toast.success(t('company_created_success'))
      }
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'company_save' }, t))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
  }

  return (
    <div className="space-y-4 max-w-[520px]">
      {company && (
        <Badge variant={company.is_published ? 'success' : 'warning'} size="xs">
          {company.is_published ? t('company_published_badge') : t('company_draft_badge')}
        </Badge>
      )}
      <Input
        label={t('company_name_label')}
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="catalog-control !h-[42px]"
      />
      {!company && (
        <Input
          label={t('company_slug_label')}
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          className="catalog-control !h-[42px]"
        />
      )}
      <Textarea
        label={t('settings_about_you')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <Input
        label={t('company_website_label')}
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://"
        className="catalog-control !h-[42px]"
      />
      <Select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="select-auth catalog-control"
        options={[
          { value: '', label: t('filter_all_regions') },
          ...UZ_REGIONS.map((r) => ({ value: r, label: r })),
        ]}
      />
      <Button variant="primary" size="sm" loading={saving} onClick={() => void save()}>
        {company ? t('company_save_btn') : t('company_create_btn')}
      </Button>
    </div>
  )
}
