'use client'

import React, { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Lock, Bell, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { api } from '@/infrastructure/api/client'

export function ProfileSettings() {
  const { t, profile, refreshProfile } = useApp()
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    city: '',
    phone: '',
    specialty: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name ?? '',
        email: profile.email ?? '',
        bio: profile.bio ?? '',
        city: profile.region ?? UZ_REGIONS[0],
        phone: profile.phone ?? '',
        specialty: profile.specialty ?? '',
      })
    }
  }, [profile])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api.updateProfile({
        full_name: formData.name,
        bio: formData.bio,
        region: formData.city,
        phone: formData.phone,
        specialty: formData.specialty,
      })
      await refreshProfile()
      setMessage(t('save_success'))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'basic', label: t('tab_basic'), icon: User },
    { id: 'security', label: t('tab_security'), icon: Lock },
    { id: 'notifications', label: t('tab_notifications'), icon: Bell },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('settings_desc')}</p>
      </div>

      <div className="border-b border-border mb-8">
        <div className="flex gap-8 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="w-4 h-4" strokeWidth={2} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-2xl">
        {activeTab === 'basic' && (
          <Card className="p-6 space-y-6">
            {message && <p className="text-sm text-primary">{message}</p>}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('full_name')}</label>
              <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('email')}</label>
              <Input type="email" value={formData.email} disabled className="opacity-70" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('phone')}</label>
              <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('specialty')}</label>
              <Input value={formData.specialty} onChange={(e) => handleChange('specialty', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('city')}</label>
              <select
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {UZ_REGIONS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">{t('bio')}</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none h-24"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving ? '...' : t('save_changes')}</Button>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card className="p-6">
            <p className="text-muted-foreground text-sm">{t('change_password')} — Supabase orqali.</p>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card className="p-6">
            <p className="text-muted-foreground text-sm">{t('email_notifications')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
