'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Star, MapPin, Clock } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiProfilePublic, ApiReview, ApiService } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { servicePath } from '@/domain/constants/routes'

export function FreelancerProfile({ profileId }: { profileId: string }) {
  const { t, isLoggedIn, currentUserRole } = useApp()
  const router = useRouter()
  const [profile, setProfile] = useState<ApiProfilePublic | null>(null)
  const [services, setServices] = useState<ApiService[]>([])
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getProfileById(profileId),
      api.listFreelancerServices(profileId),
      api.listFreelancerReviews(profileId),
    ])
      .then(([p, s, r]) => {
        setProfile(p)
        setServices(s)
        setReviews(r)
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) return <div className="p-10 text-center text-muted-foreground">...</div>
  if (!profile) return <div className="p-10 text-center text-muted-foreground">Profil topilmadi</div>

  const name = profile.full_name ?? 'Freelancer'
  const tabs = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'services', label: t('nav_services') },
    { id: 'reviews', label: t('tab_reviews') },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{name}</h1>
              <p className="text-primary mt-1">{profile.specialty ?? t('role_freelancer')}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {profile.region && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.region}</span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {profile.avg_rating ?? 0} ({profile.review_count ?? 0})
                </span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{services.length} {t('nav_services').toLowerCase()}</span>
              </div>
              {profile.bio && <p className="mt-4 text-foreground">{profile.bio}</p>}
            </div>
          </div>
        </Card>

        <div className="flex gap-4 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 font-medium text-sm border-b-2 ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <Card className="p-6">
            <p className="text-muted-foreground">{profile.bio ?? t('describe_yourself')}</p>
          </Card>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <Card key={s.id} className="p-4 cursor-pointer hover:border-primary/50" onClick={() => router.push(servicePath(s.id))}>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                <p className="text-primary font-bold mt-2">{formatPrice(s.price)}</p>
              </Card>
            ))}
            {services.length === 0 && <p className="text-muted-foreground">{t('no_services_found')}</p>}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{r.rating}/5</span>
                  <span className="text-sm text-muted-foreground">{r.profiles?.full_name ?? 'Mijoz'}</span>
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </Card>
            ))}
            {reviews.length === 0 && <p className="text-muted-foreground">{t('no_orders_yet')}</p>}
          </div>
        )}

        {isLoggedIn && currentUserRole === 'client' && services[0] && (
          <div className="mt-8">
            <Button onClick={() => router.push(servicePath(services[0].id))}>{t('order_now')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
