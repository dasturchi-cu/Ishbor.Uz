'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sprout, TrendingUp, Award, Briefcase, Search, X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { FileUploadZone } from '@/presentation/components/dashboard/file-upload-zone'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'
import { POPULAR_SKILLS } from '@/domain/constants/skills'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { api } from '@/infrastructure/api/client'
import { cn } from '@/shared/lib/utils'
import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'

type ExpLevel = 'junior' | 'mid' | 'expert'

export function OnboardingPage() {
  const { t, profile, currentUserRole, refreshProfile, userId } = useApp()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const router = useRouter()
  const isClient = currentUserRole === 'client'
  const totalSteps = isClient ? 2 : 3
  const [step, setStep] = useState(1)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [expLevel, setExpLevel] = useState<ExpLevel>('mid')
  const [hourlyRate, setHourlyRate] = useState('')
  const [languages, setLanguages] = useState([{ lang: 'uz', level: 'fluent' }])
  const [serviceTitle, setServiceTitle] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [packageTab, setPackageTab] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [packagePrice, setPackagePrice] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'ok' | 'taken'>('idle')

  const progress = Math.round((step / totalSteps) * 100)

  useEffect(() => {
    const slug = username.trim().toLowerCase().replace(/^@/, '')
    if (slug.length < 3) {
      setUsernameStatus('idle')
      return
    }
    const id = setTimeout(() => {
      api
        .checkUsername(slug)
        .then((r) => setUsernameStatus(r.available ? 'ok' : 'taken'))
        .catch(() => setUsernameStatus('idle'))
    }, 400)
    return () => clearTimeout(id)
  }, [username])

  const step1Valid = useMemo(() => {
    const base =
      fullName.trim().length > 1 &&
      username.trim().length > 2 &&
      usernameStatus !== 'taken'
    if (isClient) return base
    return base && title.trim().length > 2 && bio.trim().length > 10
  }, [fullName, username, usernameStatus, title, bio, isClient])

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (!s || skills.length >= 10 || skills.includes(s)) return
    setSkills((prev) => [...prev, s])
    setSkillInput('')
  }

  const finish = async (skipService = false) => {
    const specialtyValue = !isClient
      ? [title.trim(), ...skills].filter(Boolean).join(' · ') || undefined
      : company.trim() || undefined
    const bioValue = !isClient
      ? bio.trim() || undefined
      : company.trim()
        ? `${company.trim()}${bio.trim() ? ` — ${bio.trim()}` : ''}`
        : bio.trim() || undefined

    try {
      await api.updateProfile({
        full_name: fullName.trim() || undefined,
        username: username.trim() || undefined,
        region: city.trim() || undefined,
        specialty: specialtyValue,
        bio: bioValue,
        skills: !isClient ? skills : undefined,
        hourly_rate: !isClient && hourlyRate ? Number(hourlyRate.replace(/\D/g, '')) || undefined : undefined,
        experience_level: !isClient ? expLevel : undefined,
        languages: !isClient ? languages : undefined,
        onboarding_completed: true,
      })
    } catch {
      /* keyingi safar yangilanadi */
    }

    if (!isClient && !skipService && serviceTitle.trim() && serviceCategory && serviceDesc.trim()) {
      const price = Number(packagePrice.replace(/\s/g, '')) || 0
      if (price > 0) {
        try {
          await api.createService({
            title: serviceTitle.trim(),
            description: serviceDesc.trim(),
            category: serviceCategory,
            region: city.trim() || profile?.region || UZ_REGIONS[0],
            price,
            delivery_days: 5,
          })
        } catch {
          /* xizmat keyinroq qo'shiladi */
        }
      }
    }

    await refreshProfile()
    router.push(dashboardPathForRole(currentUserRole))
  }

  const renderProgress = () => (
    <div className="mb-6">
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--kwork-border)]">
        <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-center text-[13px] text-[var(--kwork-text-muted)]">
        {t('step_n_of_total').replace('{n}', String(step)).replace('{total}', String(totalSteps))}
      </p>
    </div>
  )

  if (step === 1) {
    return (
      <div className="min-h-[calc(100vh-var(--kwork-header-h))] bg-[var(--neutral-50)] px-4 py-8">
        <div className="surface-panel mx-auto max-w-[560px] p-6 sm:p-8">
          {renderProgress()}
          <h1 className="text-[22px] font-bold text-[var(--kwork-text)]">
            {isClient ? t('onboarding_client_profile_title') : t('onboarding_profile_title')}
          </h1>
          <div className="mt-6 space-y-5">
            <FileUploadZone
              circular
              maxFiles={1}
              disabled={avatarUploading || !userId}
              initialUrls={profile?.avatar_url ? [profile.avatar_url] : []}
              onUpload={async (files) => {
                if (!userId || !files[0] || !isSupabaseConfigured()) return []
                setAvatarUploading(true)
                try {
                  const url = await uploadAvatar(files[0], userId)
                  await api.updateProfile({ avatar_url: url })
                  await refreshProfile()
                  return [url]
                } catch {
                  return []
                } finally {
                  setAvatarUploading(false)
                }
              }}
            />
            <Input label={t('full_name')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div>
              <Input
                label={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
              />
              {usernameStatus === 'ok' && (
                <p className="mt-1 text-[12px] text-[var(--success-dark)]">{t('username_available')}</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="mt-1 text-[12px] text-[var(--error)]">{t('username_taken')}</p>
              )}
            </div>
            {!isClient && (
              <>
                <Input
                  label={t('professional_title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('professional_title_ph')}
                />
                <div>
                  <Textarea
                    label={t('bio')}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('bio_ph')}
                    rows={4}
                  />
                  <p className="mt-1 text-right text-[11px] text-[var(--kwork-text-muted)]">
                    {t('char_counter').replace('{n}', String(bio.length)).replace('{max}', '500')}
                  </p>
                </div>
              </>
            )}
            {isClient && (
              <Input
                label={t('company_name')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('company_optional')}
              />
            )}
            <Select
              label={t('city')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('select')}
              options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
              className="catalog-control"
            />
          </div>
          <Button
            variant="primary"
            fullWidth
            className="mt-8"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
          >
            {t('continue_btn')} →
          </Button>
          <button type="button" onClick={() => finish(true)} className="mt-4 block w-full text-center text-[13px] text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]">
            {t('skip')}
          </button>
          {isClient && (
            <p className="mt-6 text-center text-[12px] text-[var(--kwork-text-muted)]">{t('client_find_freelancer_hint')}</p>
          )}
        </div>
      </div>
    )
  }

  if (isClient && step === 2) {
    return (
      <div className="min-h-[calc(100vh-var(--kwork-header-h))] bg-[var(--neutral-50)] px-4 py-8">
        <div className="surface-panel mx-auto max-w-[560px] p-6 sm:p-8">
          {renderProgress()}
          <h1 className="text-[22px] font-bold text-[var(--kwork-text)]">{t('onboarding_client_project_title')}</h1>
          <div className="mt-6 space-y-4">
            <Link href={PATHS.postProject} className="block rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-6 transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]">
              <Briefcase className="h-12 w-12 text-[var(--color-primary)]" />
              <h3 className="mt-4 text-[16px] font-bold text-[var(--kwork-text)]">{t('post_project_now')}</h3>
              <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">{t('post_project_now_desc')}</p>
              <Button variant="primary" size="sm" className="mt-4">{t('post_project_btn')}</Button>
            </Link>
            <Link href={PATHS.services} className="block rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-6 transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]">
              <Search className="h-12 w-12 text-[var(--color-primary)]" />
              <h3 className="mt-4 text-[16px] font-bold text-[var(--kwork-text)]">{t('browse_catalog_title')}</h3>
              <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">{t('browse_catalog_desc')}</p>
              <Button variant="outline" size="sm" className="mt-4">{t('go_to_catalog')}</Button>
            </Link>
          </div>
          <button type="button" onClick={() => finish()} className="mt-8 block w-full text-center text-[13px] text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]">
            {t('decide_later')}
          </button>
        </div>
      </div>
    )
  }

  if (!isClient && step === 2) {
    return (
      <div className="min-h-[calc(100vh-var(--kwork-header-h))] bg-[var(--neutral-50)] px-4 py-8">
        <div className="surface-panel mx-auto max-w-[560px] p-6 sm:p-8">
          {renderProgress()}
          <h1 className="text-[22px] font-bold text-[var(--kwork-text)]">{t('onboarding_skills_title')}</h1>
          <div className="mt-6 space-y-5">
            <div>
              <Input
                label={t('skills')}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder={t('skills_placeholder')}
                className="catalog-control !h-[42px] border-[var(--kwork-border)] bg-[var(--neutral-0)] shadow-[var(--shadow-xs)]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-primary)]">
                    {s}
                    <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] font-medium text-[var(--kwork-text-muted)]">{t('popular_skills')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full border border-[var(--kwork-border)] px-3 py-1 text-[12px] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { id: 'junior' as const, icon: Sprout, title: t('exp_junior'), desc: t('exp_junior_desc'), sub: t('exp_junior_sub'), color: 'var(--success)' },
                { id: 'mid' as const, icon: TrendingUp, title: t('exp_mid'), desc: t('exp_mid_desc'), sub: t('exp_mid_sub'), color: 'var(--color-primary)' },
                { id: 'expert' as const, icon: Award, title: t('exp_expert'), desc: t('exp_expert_desc'), sub: t('exp_expert_sub'), color: 'var(--warning)' },
              ]).map((card) => {
                const Icon = card.icon
                const active = expLevel === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setExpLevel(card.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition',
                      active ? 'border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--kwork-border)] bg-[var(--neutral-0)] hover:bg-[var(--color-primary-light)]/50'
                    )}
                  >
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                    <p className="mt-2 text-[14px] font-bold text-[var(--kwork-text)]">{card.title}</p>
                    <p className="text-[12px] text-[var(--kwork-text-muted)]">{card.desc}</p>
                    <p className="mt-1 text-[11px] text-[var(--kwork-text-muted)]">{card.sub}</p>
                  </button>
                )
              })}
            </div>

            <Input
              label={t('hourly_rate_label')}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="50 000"
            />

            {languages.map((row, i) => (
              <div key={i} className="grid min-w-0 gap-3 sm:grid-cols-2">
                <Select
                  wrapperClassName="min-w-0"
                  value={row.lang}
                  onChange={(e) => setLanguages((p) => p.map((l, j) => (j === i ? { ...l, lang: e.target.value } : l)))}
                  options={[
                    { value: 'uz', label: t('lang_uzbek') },
                    { value: 'ru', label: t('lang_russian') },
                    { value: 'en', label: t('lang_english') },
                  ]}
                  className="catalog-control"
                />
                <Select
                  wrapperClassName="min-w-0"
                  value={row.level}
                  onChange={(e) => setLanguages((p) => p.map((l, j) => (j === i ? { ...l, level: e.target.value } : l)))}
                  options={[
                    { value: 'beginner', label: t('lang_level_beginner') },
                    { value: 'intermediate', label: t('lang_level_intermediate') },
                    { value: 'fluent', label: t('lang_level_fluent') },
                    { value: 'native', label: t('lang_level_native') },
                  ]}
                  className="catalog-control"
                />
              </div>
            ))}
            {languages.length < 3 && (
              <Button variant="ghost" size="sm" onClick={() => setLanguages((p) => [...p, { lang: 'ru', level: 'intermediate' }])}>
                + {t('add_language')}
              </Button>
            )}
          </div>
          <Button variant="primary" fullWidth className="mt-8" onClick={() => setStep(3)}>
            {t('continue_btn')} →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-var(--kwork-header-h))] bg-[var(--neutral-50)] px-4 py-8">
      <div className="surface-panel mx-auto max-w-[560px] p-6 sm:p-8">
        {renderProgress()}
        <h1 className="text-[22px] font-bold text-[var(--kwork-text)]">{t('onboarding_first_service_title')}</h1>
        <div className="mt-6 space-y-5">
          <Input label={t('service_title')} value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} placeholder={t('service_title_ph')} />
          <Select
            label={t('category')}
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
            placeholder={t('select')}
            options={KWORK_CATEGORY_ITEMS.map((c) => ({ value: c.cat, label: t(c.labelKey) }))}
            className="catalog-control"
          />
          <Textarea label={t('description')} value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} rows={6} />
          <div className="flex gap-2">
            {(['basic', 'standard', 'premium'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPackageTab(tab)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[13px] font-medium',
                  packageTab === tab ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--neutral-50)] text-[var(--kwork-text-muted)]'
                )}
              >
                {t(tab === 'basic' ? 'package_basic' : tab === 'standard' ? 'package_standard' : 'package_premium')}
              </button>
            ))}
          </div>
          <Input label={t('col_price')} value={packagePrice} onChange={(e) => setPackagePrice(e.target.value)} placeholder="150 000" />
        </div>
        <Button variant="primary" fullWidth size="lg" className="mt-8" onClick={() => finish()}>
          {t('finish_profile')}
        </Button>
        <button type="button" onClick={() => finish(true)} className="mt-4 block w-full text-center text-[13px] text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]">
          {t('add_later')}
        </button>
      </div>
    </div>
  )
}
