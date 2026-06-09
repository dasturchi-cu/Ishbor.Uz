'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { PATHS } from '@/domain/constants/routes'
import { toast } from '@/presentation/components/ui/toast'
import { FileDown, Copy } from 'lucide-react'
import { useServerDraft } from '@/shared/lib/use-server-draft'

type CvForm = {
  fullName: string
  headline: string
  skills: string
  experience: string
  education: string
  contacts: string
}

const CV_INITIAL: CvForm = {
  fullName: '',
  headline: '',
  skills: '',
  experience: '',
  education: '',
  contacts: '',
}

export function CvBuilderPage() {
  const { t, isLoggedIn } = useApp()
  const [form, setForm] = useState<CvForm>(CV_INITIAL)
  const draft = useServerDraft('cv-builder', form, isLoggedIn, (remote) => {
    setForm({ ...CV_INITIAL, ...remote })
    toast.info(t('draft_restored'))
  })
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const restored = draft.hydrate(CV_INITIAL) as CvForm
    if (restored.fullName || restored.experience || restored.skills) {
      setForm(restored)
    }
  }, [draft])

  const preview = useMemo(() => {
    const lines: string[] = []
    if (form.fullName.trim()) lines.push(form.fullName.trim().toUpperCase())
    if (form.headline.trim()) lines.push(form.headline.trim())
    if (form.contacts.trim()) {
      lines.push('')
      lines.push(form.contacts.trim())
    }
    if (form.skills.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_skills_label')}:`)
      lines.push(form.skills.trim())
    }
    if (form.experience.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_experience_label')}:`)
      lines.push(form.experience.trim())
    }
    if (form.education.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_education_label')}:`)
      lines.push(form.education.trim())
    }
    return lines.join('\n')
  }, [form, t])

  const handleCopy = async () => {
    if (!preview.trim()) {
      toast.error(t('cv_builder_empty'))
      return
    }
    try {
      await navigator.clipboard.writeText(preview)
      toast.success(t('cv_builder_copied'))
    } catch {
      toast.error(t('newsletter_save_failed'))
    }
  }

  const handleDownload = () => {
    if (!preview.trim()) {
      toast.error(t('cv_builder_empty'))
      return
    }
    const blob = new Blob([preview], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.fullName.trim() || 'cv'}-ishbor.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('cv_builder_downloaded'))
  }

  const update = (patch: Partial<CvForm>) => setForm((prev) => ({ ...prev, ...patch }))

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--kwork-text)] sm:text-[24px]">{t('cv_builder_title')}</h1>
        <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">{t('cv_builder_subtitle')}</p>
        {!isLoggedIn && (
          <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">
            <Link href={PATHS.login} className="text-[var(--color-primary)] hover:underline">
              {t('login')}
            </Link>{' '}
            — {t('cv_builder_profile_cta')}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-[var(--kwork-border)] bg-white p-4 dark:bg-[var(--neutral-900)]">
          <Input value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder={t('settings_your_name')} />
          <Input value={form.headline} onChange={(e) => update({ headline: e.target.value })} placeholder={t('cv_builder_headline')} />
          <Input value={form.contacts} onChange={(e) => update({ contacts: e.target.value })} placeholder={t('cv_builder_contacts_ph')} />
          <Textarea value={form.skills} onChange={(e) => update({ skills: e.target.value })} rows={3} placeholder={t('cv_builder_skills_label')} />
          <Textarea value={form.experience} onChange={(e) => update({ experience: e.target.value })} rows={5} placeholder={t('cv_builder_experience_label')} />
          <Textarea value={form.education} onChange={(e) => update({ education: e.target.value })} rows={3} placeholder={t('cv_builder_education_label')} />
        </div>
        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-50)] p-4 dark:bg-[var(--neutral-900)]">
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--kwork-text)]">{preview || t('cv_builder_preview_empty')}</pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {t('cv_builder_copy')}
            </Button>
            <Button variant="primary" onClick={handleDownload}>
              <FileDown className="mr-2 h-4 w-4" />
              {t('cv_builder_download')}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
