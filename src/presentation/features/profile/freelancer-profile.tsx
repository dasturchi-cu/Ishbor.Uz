'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  Calendar,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Settings,
  Share2,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { RatingStars } from '@/presentation/components/ui/rating-stars'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiProfilePublic, ApiReview, ApiService } from '@/infrastructure/api/types'
import { PATHS, servicePath } from '@/domain/constants/routes'
import { loginPath, registerPath } from '@/shared/lib/auth-redirect'
import { toast } from '@/presentation/components/ui/toast'
import type { TranslationKey } from '@/infrastructure/i18n'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { initialsFromName } from '@/shared/lib/avatar'
import { cn } from '@/shared/lib/utils'
import { isFreelancerSaved, syncSavedFreelancersFromApi, toggleSavedFreelancer } from '@/shared/lib/saved-items'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { SkeletonProfileHero } from '@/presentation/components/ui/skeleton'
import { UserX } from 'lucide-react'
import { JsonLdBreadcrumb, JsonLdPerson } from '@/presentation/components/seo/json-ld'

type ProfileTab = 'about' | 'services' | 'portfolio' | 'reviews'

const LANG_LABELS: Record<string, TranslationKey> = {
  uz: 'lang_uzbek',
  ru: 'lang_russian',
  en: 'lang_english',
}

const LEVEL_LABELS: Record<string, TranslationKey> = {
  beginner: 'lang_level_beginner',
  intermediate: 'lang_level_intermediate',
  fluent: 'lang_level_fluent',
  native: 'lang_level_native',
}

function yearsOnPlatform(iso: string | undefined): number {
  if (!iso) return 1
  const years = Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.max(1, years)
}

export function FreelancerProfile({ profileId }: { profileId: string }) {
  const { t, isLoggedIn, currentUserRole, userId } = useApp()
  const router = useRouter()
  const [profile, setProfile] = useState<ApiProfilePublic | null>(null)
  const [services, setServices] = useState<ApiService[]>([])
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [contactHint, setContactHint] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('about')
  const [shareHint, setShareHint] = useState('')

  useEffect(() => {
    api.recordProfileView(profileId).catch(() => undefined)
  }, [profileId])

  const loadProfile = useCallback(() => {
    setLoading(true)
    setLoadError(false)
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
      .catch((e) => {
        setProfile(null)
        setLoadError(!(e instanceof ApiError && e.status === 404))
      })
      .finally(() => setLoading(false))
  }, [profileId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!isLoggedIn) return
    syncSavedFreelancersFromApi().then(() => setFavorite(isFreelancerSaved(profileId)))
  }, [profileId, isLoggedIn])

  const stats = useMemo(() => {
    const rating = profile?.avg_rating ?? 0
    const reviewCount = profile?.review_count ?? reviews.length
    const completed = profile?.completed_orders ?? 0
    return { rating, reviewCount, completed }
  }, [profile, reviews.length])

  const portfolioImages = useMemo(() => {
    const fromProfile = (profile?.portfolio_urls ?? []).map((url) => ({
      url,
      title: t('portfolio'),
      serviceId: '',
    }))
    const fromServices = services.flatMap((s) =>
      (s.image_urls ?? []).map((url) => ({ url, title: s.title, serviceId: s.id }))
    )
    return [...fromProfile, ...fromServices]
  }, [services, profile?.portfolio_urls, t])

  const handleContact = async () => {
    if (!isLoggedIn || currentUserRole !== 'client') return
    const orders = await api.listOrders().catch(() => [])
    const existing = orders.find(
      (o) =>
        o.freelancer_id === profileId &&
        ['pending', 'active', 'delivered', 'disputed'].includes(o.status)
    )
    if (existing) {
      router.push(`${PATHS.dashboardMessages}?order=${existing.id}`)
      return
    }
    if (services[0]) {
      router.push(servicePath(services[0].id))
      return
    }
    setContactHint(true)
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) {
        await navigator.share({ url, title: profile?.full_name ?? 'IshBor' })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareHint(t('profile_link_copied'))
      window.setTimeout(() => setShareHint(''), 2000)
    } catch {
      /* cancelled or unsupported */
    }
  }

  if (loading) {
    return <SkeletonProfileHero />
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        {loadError ? (
          <Alert variant="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t('data_load_failed')}</span>
              <Button variant="outline" size="sm" onClick={loadProfile}>
                {t('catalog_retry')}
              </Button>
            </div>
          </Alert>
        ) : (
          <EmptyState
            icon={<UserX />}
            title={t('profile_not_found_title')}
            description={t('profile_not_found_desc')}
            action={{ label: t('nav_freelancers'), onClick: () => router.push(PATHS.freelancers) }}
          />
        )}
      </div>
    )
  }

  const name = profile.full_name ?? t('freelancer')
  const isOwnProfile = userId === profileId
  const profileReturnTo = `/freelancer/${profileId}`
  const memberYears = yearsOnPlatform(profile.created_at)
  const locationLabel = profile.region
    ? t('profile_location_format').replace('{region}', profile.region)
    : t('country_uzbekistan')
  const bioText = profile.bio?.trim()

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'about', label: t('tab_about') },
    { id: 'services', label: `${t('nav_services')} (${services.length})` },
    { id: 'portfolio', label: `${t('tab_portfolio')} (${portfolioImages.length})` },
    { id: 'reviews', label: `${t('tab_reviews')} (${stats.reviewCount})` },
  ]

  return (
    <div className="min-h-screen bg-[var(--body-bg)] pb-12">
      <JsonLdPerson
        id={profileId}
        name={name}
        description={bioText ?? profile.specialty ?? undefined}
        imageUrl={profile.avatar_url || undefined}
        rating={stats.rating > 0 ? stats.rating : undefined}
        reviewCount={stats.reviewCount > 0 ? stats.reviewCount : undefined}
      />
      <JsonLdBreadcrumb
        items={[
          { name: t('home'), path: PATHS.home },
          { name: t('nav_freelancers'), path: PATHS.freelancers },
          { name, path: `/freelancer/${profileId}` },
        ]}
      />
      <div className="mx-auto max-w-[1140px] px-4 pt-5 sm:px-5">
        <Breadcrumb
          items={[
            { label: t('home'), href: PATHS.home },
            { label: t('nav_freelancers'), href: PATHS.freelancers },
            { label: name },
          ]}
        />
      </div>
      <div className="freelancer-profile-cover" aria-hidden />
      <div className="freelancer-profile">
        <section className="freelancer-profile-hero freelancer-profile-hero--overlap">
          <div className="freelancer-profile-hero-inner">
            <div className="freelancer-profile-hero-top">
              <div className="freelancer-profile-hero-main">
                <Avatar name={name} size={96} verified={profile.is_verified} />
                <div className="freelancer-profile-info">
                  <div className="freelancer-profile-badges">
                    {profile.is_verified && (
                      <span className="freelancer-profile-badge freelancer-profile-badge--pro">
                        {t('badge_verified')}
                      </span>
                    )}
                  </div>
                  <h1 className="freelancer-profile-name">{name}</h1>
                  {profile.specialty && (
                    <p className="freelancer-profile-specialty">{profile.specialty}</p>
                  )}
                  <ul className="freelancer-profile-meta-list">
                    <li className="freelancer-profile-meta-item">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {locationLabel}
                    </li>
                    <li className="freelancer-profile-meta-item">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {t('member_since').replace('{n}', String(memberYears))}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="freelancer-profile-actions">
                {isOwnProfile ? (
                  <Link href={PATHS.dashboardSettings}>
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<Settings className="h-4 w-4" />}
                    >
                      {t('profile_account_settings')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    {!isLoggedIn && (
                      <>
                        <Button
                          variant="primary"
                          size="md"
                          className="hide-mobile"
                          onClick={() => router.push(loginPath(profileReturnTo))}
                        >
                          {t('order_secure_cta')}
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          className="hide-mobile"
                          onClick={() => router.push(registerPath(profileReturnTo))}
                        >
                          {t('register')}
                        </Button>
                      </>
                    )}
                    {contactHint && (
                      <Alert variant="info" className="mb-3 w-full">
                        <p>{t('contact_requires_order')}</p>
                        {services[0] ? (
                          <Link href={servicePath(services[0].id)} className="mt-3 inline-block">
                            <Button variant="primary" size="sm">
                              {t('contact_order_cta')}
                            </Button>
                          </Link>
                        ) : (
                          <Link href={PATHS.services} className="mt-3 inline-block">
                            <Button variant="outline" size="sm">
                              {t('contact_browse_services')}
                            </Button>
                          </Link>
                        )}
                      </Alert>
                    )}
                    {isLoggedIn && currentUserRole === 'client' && (
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<MessageCircle className="h-4 w-4" />}
                        onClick={handleContact}
                      >
                        {t('send_message')}
                      </Button>
                    )}
                    {isLoggedIn && (
                      <Button
                        variant="outline"
                        size="md"
                        leftIcon={<Bookmark className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />}
                        onClick={() => {
                          if (currentUserRole !== 'client') {
                            toast.info(t('client_only_saved'))
                            return
                          }
                          toggleSavedFreelancer(profileId).then(setFavorite)
                        }}
                      >
                        {t('profile_favorite')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t('profile_share')}
                      className="h-10 w-10"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {shareHint && (
              <p className="mt-2 text-[12px] text-[var(--success-dark)]">{shareHint}</p>
            )}

            <div className="freelancer-profile-stats">
              <div className="freelancer-profile-stat">
                <div className="freelancer-profile-stat-value">
                  <Star className="h-4 w-4 fill-[var(--rating-filled)] text-[var(--rating-filled)]" />
                  {stats.rating.toFixed(1)}
                </div>
                <p className="freelancer-profile-stat-label">{t('average_rating')}</p>
              </div>
              <div className="freelancer-profile-stat">
                <p className="freelancer-profile-stat-value">{stats.reviewCount}</p>
                <p className="freelancer-profile-stat-label">{t('stat_reviews')}</p>
              </div>
              <div className="freelancer-profile-stat">
                <p className="freelancer-profile-stat-value">{stats.completed}</p>
                <p className="freelancer-profile-stat-label">{t('stat_completed')}</p>
              </div>
              <div className="freelancer-profile-stat">
                <p className="freelancer-profile-stat-value">{services.length}</p>
                <p className="freelancer-profile-stat-label">{t('nav_services')}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="freelancer-profile-body">
          <div className="freelancer-profile-main">
            <div className="freelancer-profile-tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'freelancer-profile-tab',
                    activeTab === tab.id && 'freelancer-profile-tab--active'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="freelancer-profile-panel" role="tabpanel">
              {activeTab === 'about' && (
                bioText ? (
                  <p className="freelancer-profile-about-text">{bioText}</p>
                ) : (
                  <EmptyState
                    compact
                    icon={<FileText />}
                    title={t('profile_about_empty')}
                    description={t('profile_no_info')}
                  />
                )
              )}

              {activeTab === 'services' && (
                services.length > 0 ? (
                  <div className="freelancer-profile-services-grid">
                    {services.map((s) => (
                      <ServiceCard
                        key={s.id}
                        title={s.title}
                        sellerName={name}
                        sellerInitials={initialsFromName(name)}
                        rating={stats.rating}
                        reviewCount={stats.reviewCount}
                        price={s.price}
                        category={s.category}
                        isPro={profile.is_verified}
                        onClick={() => router.push(servicePath(s.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="freelancer-profile-empty">
                    {t('profile_no_kworks').replace('{name}', name)}
                  </p>
                )
              )}

              {activeTab === 'portfolio' && (
                portfolioImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {portfolioImages.map((item, i) => {
                      const img = (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="aspect-square w-full object-cover transition group-hover:scale-105"
                        />
                      )
                      return item.serviceId ? (
                        <button
                          key={`${item.serviceId}-${i}`}
                          type="button"
                          onClick={() => router.push(servicePath(item.serviceId))}
                          className="group overflow-hidden rounded-lg border border-[var(--kwork-border)]"
                        >
                          {img}
                        </button>
                      ) : (
                        <div
                          key={`portfolio-${i}`}
                          className="group overflow-hidden rounded-lg border border-[var(--kwork-border)]"
                        >
                          {img}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="freelancer-profile-empty">{t('portfolio_empty')}</p>
                )
              )}

              {activeTab === 'reviews' && (
                reviews.length > 0 ? (
                  <div>
                    {reviews.map((r) => (
                      <div key={r.id} className="freelancer-profile-review">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <RatingStars rating={r.rating} size="sm" />
                          <span className="flex items-center gap-1 text-xs text-[var(--kwork-text-muted)]">
                            <Clock className="h-3.5 w-3.5" />
                            {r.profiles?.full_name ?? t('role_client_label')}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-sm leading-relaxed text-[var(--kwork-text-muted)]">{r.comment}</p>
                        )}
                        {r.reply && (
                          <p className="mt-2 rounded-lg bg-[var(--color-primary-light)] px-3 py-2 text-sm text-[var(--kwork-text-sub)]">
                            <span className="font-semibold text-[var(--color-primary)]">{t('review_reply')}: </span>
                            {r.reply}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="freelancer-profile-empty">
                    {t('profile_no_reviews').replace('{name}', name)}
                  </p>
                )
              )}
            </div>
          </div>

          <aside className="freelancer-profile-sidebar">
            {!isOwnProfile && !isLoggedIn ? (
              <div className="freelancer-profile-guest-card hide-mobile">
                <div className="freelancer-profile-guest-head">
                  <span className="freelancer-profile-guest-eyebrow">{t('contact_freelancer')}</span>
                  <h2 className="freelancer-profile-guest-title">
                    {t('profile_guest_cta_title').replace('{name}', name)}
                  </h2>
                  <p className="freelancer-profile-guest-desc">{t('profile_guest_cta_desc')}</p>
                </div>

                {services.length > 0 && (
                  <button
                    type="button"
                    className="freelancer-profile-guest-service"
                    onClick={() => setActiveTab('services')}
                  >
                    <span className="freelancer-profile-guest-service-count">{services.length}</span>
                    <span className="freelancer-profile-guest-service-label">{t('nav_services')}</span>
                  </button>
                )}

                <ul className="freelancer-profile-guest-trust">
                  <li>
                    <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    {t('register_client_bullet_2')}
                  </li>
                  <li>
                    <Star className="h-4 w-4 shrink-0" aria-hidden />
                    {t('profile_guest_trust_reviews')}
                  </li>
                </ul>

                <div className="freelancer-profile-guest-actions">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => router.push(loginPath(profileReturnTo))}
                  >
                    {t('order_secure_cta')}
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => router.push(registerPath(profileReturnTo))}
                  >
                    {t('register')}
                  </Button>
                  <p className="freelancer-profile-guest-note">{t('profile_guest_free')}</p>
                </div>
              </div>
            ) : (
              <div className="freelancer-profile-side-card">
                <span className="freelancer-profile-side-title">{t('last_30_days')}</span>
                <div className="freelancer-profile-side-stat">
                  <span className="freelancer-profile-side-stat-label">{t('stat_completed')}</span>
                  <span className="freelancer-profile-side-stat-value">
                    {stats.completed > 0 ? String(stats.completed) : '—'}
                  </span>
                </div>
                <div className="freelancer-profile-side-stat">
                  <span className="freelancer-profile-side-stat-label">{t('stat_reviews')}</span>
                  <span className="freelancer-profile-side-stat-value">
                    {stats.reviewCount > 0 ? String(stats.reviewCount) : '—'}
                  </span>
                </div>
                {!isOwnProfile && isLoggedIn && currentUserRole === 'client' && (
                  <div className="freelancer-profile-side-actions">
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={<MessageCircle className="h-4 w-4" />}
                      onClick={handleContact}
                    >
                      {t('send_message')}
                    </Button>
                    {services.length > 0 && (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setActiveTab('services')}
                      >
                        {t('nav_services')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(profile.languages?.length ?? 0) > 0 && (
              <div className="freelancer-profile-side-card">
                <h3 className="text-[14px] font-bold text-[var(--kwork-text)]">{t('languages_label')}</h3>
                <div className="mt-3">
                  {profile.languages!.map((row, i) => (
                    <div key={`${row.lang}-${i}`} className="freelancer-profile-lang-row">
                      <span className="freelancer-profile-lang-name">
                        {t(LANG_LABELS[row.lang] ?? 'lang_uzbek')}
                      </span>
                      <span className="freelancer-profile-lang-level">
                        {t(LEVEL_LABELS[row.level] ?? 'lang_level_fluent')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {!isOwnProfile && (
        <div className="mobile-sticky-cta show-mobile">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold text-[var(--kwork-text)]">{name}</span>
            <span className="text-[11px] text-[var(--kwork-text-muted)]">
              {stats.reviewCount > 0
                ? `${stats.rating.toFixed(1)} · ${stats.reviewCount} ${t('stat_reviews').toLowerCase()}`
                : services.length > 0
                  ? `${services.length} ${t('nav_services').toLowerCase()}`
                  : t('freelancer')}
            </span>
          </div>
          {isLoggedIn && currentUserRole === 'client' ? (
            <Button
              variant="primary"
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={handleContact}
              className="shrink-0 px-5"
            >
              {t('send_message')}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="shrink-0 px-5"
              onClick={() => router.push(loginPath(profileReturnTo))}
            >
              {t('order_secure_cta')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
