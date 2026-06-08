'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import Link from 'next/link'
import { Camera, ChevronRight, ExternalLink } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Select } from '@/presentation/components/ui/select'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { freelancerPath } from '@/domain/constants/routes'
import { POPULAR_SKILLS } from '@/domain/constants/skills'
import { saveProfileFields } from '@/shared/lib/profile-fields'
import { cn } from '@/shared/lib/utils'

const BIO_MAX = 500

export function DashboardProfilePage() {
  const { t, profile, userId, refreshProfile } = useApp()
  const role = useDashboardRole()
  const isFreelancer = role === 'freelancer'
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'view' | 'edit'>('edit')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [region, setRegion] = useState<string>(UZ_REGIONS[0])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'ok' | 'taken'>('idle')

  const syncFromProfile = useCallback(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setUsername(profile.username ?? '')
    setTitle(profile.specialty ?? '')
    setBio(profile.bio ?? '')
    setRegion(profile.region ?? UZ_REGIONS[0])
    setAvatarPreview(profile.avatar_url ?? null)
    setPendingAvatarFile(null)
  }, [profile])

  useEffect(() => {
    syncFromProfile()
  }, [syncFromProfile])

  useEffect(() => {
    const slug = username.trim().toLowerCase().replace(/^@/, '')
    if (slug.length < 3 || slug === profile?.username) {
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
  }, [username, profile?.username])

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setPendingAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed || skills.includes(trimmed) || skills.length >= 10) return
    setSkills((prev) => [...prev, trimmed])
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setMessage('')
    try {
      if (usernameStatus === 'taken') {
        setMessage(t('username_taken'))
        return
      }
      await saveProfileFields(
        userId,
        {
          full_name: fullName,
          username: username.trim() || undefined,
          bio,
          region,
          specialty: title,
        },
        pendingAvatarFile,
        profile?.avatar_url,
      )
      await refreshProfile()
      setPendingAvatarFile(null)
      setMessage(t('save_success'))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setSaving(false)
    }
  }

  const displayName = fullName || profile?.full_name || t('nav_profile')
  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null

  return (
    <div className="profile-edit-layout">
      <div className="profile-edit-tabs">
        {(['view', 'edit'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn('profile-edit-tab', tab === key && 'profile-edit-tab--active')}
          >
            {key === 'view' ? t('profile_view_tab') : t('profile_edit_tab')}
          </button>
        ))}
      </div>

      {message && (
        <Alert variant="success" className="mb-4">
          {message}
        </Alert>
      )}

      {tab === 'view' ? (
        <div className="profile-view-card">
          <Avatar name={displayName} src={avatarSrc} size={96} />
          <div>
            <p className="profile-view-name">{profile?.full_name ?? '—'}</p>
            {profile?.region && <p className="profile-view-meta mt-1">{profile.region}</p>}
            {isFreelancer && profile?.specialty && (
              <p className="profile-view-meta mt-0.5">{profile.specialty}</p>
            )}
          </div>
          {userId && (
            <Link href={freelancerPath(userId)} className="profile-view-link">
              {t('view_public_profile')}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <section className="profile-edit-card">
            <div className="profile-edit-card-header">
              <h2 className="profile-edit-card-title">{t('basic_info_section')}</h2>
              <p className="profile-edit-card-desc">{t('basic_info_desc')}</p>
            </div>

            <div className="profile-edit-card-body">
              <div className="profile-edit-avatar-row">
                <div className="profile-edit-avatar-upload">
                  <Avatar name={displayName} src={avatarSrc} size={96} />
                  <button
                    type="button"
                    className="profile-edit-avatar-overlay"
                    onClick={() => fileRef.current?.click()}
                    aria-label={t('upload_photo')}
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="profile-edit-avatar-hint-title">{t('upload_photo')}</p>
                  <p className="profile-edit-avatar-hint">{t('tip_upload_photo')}</p>
                </div>
              </div>

              <div className="profile-edit-form-grid profile-edit-form-grid--2">
                <Input
                  label={t('full_name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <div>
                  <Input
                    label={t('username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder={t('username_ph')}
                  />
                  {usernameStatus === 'ok' && (
                    <p className="mt-1 text-[12px] text-[var(--success-dark)]">{t('username_available')}</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="mt-1 text-[12px] text-[var(--error)]">{t('username_taken')}</p>
                  )}
                </div>
              </div>

              {isFreelancer && (
                <div className="profile-edit-form-grid mt-4">
                  <Input
                    label={t('professional_title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('professional_title_ph')}
                  />
                  <Textarea
                    label={t('bio')}
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                    rows={4}
                    hint={t('char_counter')
                      .replace('{n}', String(bio.length))
                      .replace('{max}', String(BIO_MAX))}
                  />
                </div>
              )}

              <div className="mt-4 profile-edit-field-narrow">
                <Select
                  label={t('city')}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  options={UZ_REGIONS.map((r) => ({ value: r, label: r }))}
                  placeholder={t('select')}
                />
              </div>

              <div className="profile-edit-footer">
                <Button variant="outline" size="sm" type="button" onClick={syncFromProfile}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  className="profile-edit-save-btn"
                  onClick={handleSave}
                  loading={saving}
                >
                  {t('save_changes')}
                </Button>
              </div>
            </div>
          </section>

          {isFreelancer && (
            <section className="profile-edit-card">
              <div className="profile-edit-card-header">
                <h2 className="profile-edit-card-title">{t('skills_section')}</h2>
                <p className="profile-edit-card-desc">{t('skills_section_desc')}</p>
              </div>

              <div className="profile-edit-card-body">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder={t('skills_placeholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill(skillInput)
                    }
                  }}
                />

                {skills.length > 0 && (
                  <div className="profile-edit-skills-tags">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="profile-edit-skill-tag"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-[12px] font-medium text-[var(--kwork-text-muted)]">
                  {t('popular_skills')}
                </p>
                <div className="profile-edit-skills-tags">
                  {POPULAR_SKILLS.slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="profile-edit-skill-tag"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {userId && (
            <Link
              href={freelancerPath(userId)}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
            >
              {t('view_public_profile')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
