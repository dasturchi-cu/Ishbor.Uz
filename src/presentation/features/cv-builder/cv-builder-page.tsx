'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { PATHS } from '@/domain/constants/routes'
import { toast } from '@/presentation/components/ui/toast'
import { FileDown, Copy } from 'lucide-react'

export function CvBuilderPage() {
  const { t } = useApp()
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [education, setEducation] = useState('')
  const [contacts, setContacts] = useState('')

  const preview = useMemo(() => {
    const lines: string[] = []
    if (fullName.trim()) lines.push(fullName.trim().toUpperCase())
    if (headline.trim()) lines.push(headline.trim())
    if (contacts.trim()) {
      lines.push('')
      lines.push(contacts.trim())
    }
    if (skills.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_skills_label')}:`)
      lines.push(skills.trim())
    }
    if (experience.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_experience_label')}:`)
      lines.push(experience.trim())
    }
    if (education.trim()) {
      lines.push('')
      lines.push(`${t('cv_builder_education_label')}:`)
      lines.push(education.trim())
    }
    return lines.join('\n')
  }, [contacts, education, experience, fullName, headline, skills, t])

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
    a.download = `${fullName.trim() || 'cv'}-ishbor.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('cv_builder_downloaded'))
  }

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--kwork-text)] sm:text-[24px]">{t('cv_builder_title')}</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-[var(--kwork-text-muted)]">{t('cv_builder_subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5">
          <Input label={t('full_name')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label={t('cv_builder_headline')} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <Input
            label={t('cv_builder_contacts')}
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
            placeholder={t('cv_builder_contacts_ph')}
          />
          <Textarea
            label={t('cv_builder_skills_label')}
            rows={3}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <Textarea
            label={t('cv_builder_experience_label')}
            rows={4}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
          <Textarea
            label={t('cv_builder_education_label')}
            rows={3}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />
        </div>

        <div className="flex flex-col rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5">
          <h2 className="text-[15px] font-bold text-[var(--kwork-text)]">{t('cv_builder_preview')}</h2>
          <pre className="mt-3 min-h-[280px] flex-1 whitespace-pre-wrap rounded-lg border border-[var(--kwork-border)] bg-[var(--neutral-50)] p-4 text-[13px] leading-relaxed text-[var(--kwork-text)]">
            {preview.trim() || t('cv_builder_preview_empty')}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              {t('cv_builder_copy')}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownload}>
              <FileDown className="h-4 w-4" />
              {t('cv_builder_download')}
            </Button>
            <Link href={PATHS.dashboardProfile}>
              <Button variant="primary">{t('cv_builder_profile_cta')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
