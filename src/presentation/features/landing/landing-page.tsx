'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS, freelancerPath, servicePath } from '@/domain/constants/routes'
import { ArrowDown, CheckCircle2, Shield, Zap, MapPin, Star, Code2, Smartphone, Palette, PenLine, Megaphone, Languages, Video, Briefcase, LayoutDashboard, TrendingUp, Users, Quote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiProject, ApiPublicReview, ApiPublicStats } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'

type HeroTab = 'projects' | 'services' | 'rating'

const EMPTY_STATS: ApiPublicStats = {
  freelancers: 0,
  clients: 0,
  projects: 0,
  services: 0,
  avg_rating: 0,
  review_count: 0,
  category_counts: {},
  top_services: [],
  featured_freelancers: [],
}

function useAnimatedCounters(targets: { freelancers: number; clients: number; projects: number; rating: number }) {
  const [counters, setCounters] = useState({ freelancers: 0, clients: 0, projects: 0, rating: 0 })

  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const from = { ...counters }
    const to = targets

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCounters({
        freelancers: Math.round(from.freelancers + (to.freelancers - from.freelancers) * ease),
        clients: Math.round(from.clients + (to.clients - from.clients) * ease),
        projects: Math.round(from.projects + (to.projects - from.projects) * ease),
        rating: Math.round((from.rating + (to.rating - from.rating) * ease) * 10) / 10,
      })
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets.freelancers, targets.clients, targets.projects, targets.rating])

  return counters
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function formatReviewDate(dateStr?: string): string | null {
  if (!dateStr) return null
  try {
    return new Intl.DateTimeFormat('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(dateStr)
    )
  } catch {
    return null
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  )
}

export function LandingPage() {
  const { t } = useApp()
  const router = useRouter()
  const [stats, setStats] = useState<ApiPublicStats>(EMPTY_STATS)
  const [reviews, setReviews] = useState<ApiPublicReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [heroProjects, setHeroProjects] = useState<ApiProject[]>([])
  const [heroTab, setHeroTab] = useState<HeroTab>('services')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    api.publicStats().then(setStats).catch(() => setStats(EMPTY_STATS))
  }, [])

  useEffect(() => {
    setReviewsLoading(true)
    api
      .listPublicReviews(6)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [])

  useEffect(() => {
    api
      .listProjects({ status: 'open' })
      .then((data) => setHeroProjects(data.slice(0, 3)))
      .catch(() => setHeroProjects([]))
  }, [])

  const heroTabs: { id: HeroTab; label: string }[] = [
    { id: 'projects', label: t('stats_projects') },
    { id: 'services', label: t('services') },
    { id: 'rating', label: t('stats_rating') },
  ]

  const counterTargets = useMemo(
    () => ({
      freelancers: stats.freelancers,
      clients: stats.clients,
      projects: stats.projects,
      rating: stats.avg_rating,
    }),
    [stats]
  )
  const counters = useAnimatedCounters(counterTargets)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categoryDefs: { id: string; icon: LucideIcon; name: string; color: string }[] = [
    { id: 'web', icon: Code2, name: t('categories_web_dev'), color: 'from-blue-500 to-cyan-500' },
    { id: 'mobile', icon: Smartphone, name: t('categories_mobile'), color: 'from-violet-500 to-purple-500' },
    { id: 'uiux', icon: Palette, name: t('categories_design'), color: 'from-pink-500 to-rose-500' },
    { id: 'graphic', icon: Palette, name: t('cat_graphic'), color: 'from-fuchsia-500 to-pink-500' },
    { id: 'writing', icon: PenLine, name: t('categories_writing'), color: 'from-amber-500 to-orange-500' },
    { id: 'seo', icon: Megaphone, name: t('cat_seo'), color: 'from-emerald-500 to-teal-500' },
    { id: 'video', icon: Video, name: t('categories_video'), color: 'from-red-500 to-orange-500' },
    { id: 'design', icon: Languages, name: t('design'), color: 'from-indigo-500 to-blue-500' },
  ]

  const categories = categoryDefs.map((cat) => ({
    ...cat,
    count: stats.category_counts[cat.id] ?? 0,
  }))

  const heroServices = stats.top_services.length > 0
    ? stats.top_services
    : []

  const categoryColors: Record<string, string> = {
    web: 'bg-indigo-500',
    mobile: 'bg-violet-500',
    uiux: 'bg-pink-500',
    graphic: 'bg-fuchsia-500',
    writing: 'bg-amber-500',
    seo: 'bg-emerald-500',
    video: 'bg-red-500',
  }

  const heroTrustBadges: { icon: LucideIcon; text: string }[] = [
    { icon: CheckCircle2, text: t('trust_commission') },
    { icon: Shield, text: t('trust_escrow') },
    { icon: Zap, text: t('trust_withdrawal') },
  ]

  const comparisonFeatures = [
    { feature: 'Komissiya', ishbor: '0%', kwork: '20%' },
    { feature: 'To\'lov tizimi', ishbor: 'Click/Payme', kwork: 'Xorijiy karta' },
    { feature: 'Til', ishbor: 'O\'zbek', kwork: 'Yo\'q' },
    { feature: 'Pul yechish', ishbor: '24 soat', kwork: 'Sekin' },
    { feature: 'Escrow', ishbor: 'Bor', kwork: 'Yo\'q' },
  ]

  const featuredFreelancers = stats.featured_freelancers.length > 0
    ? stats.featured_freelancers.map((f) => ({
        id: f.id,
        name: f.full_name ?? 'Freelancer',
        specialty: f.specialty ?? t('role_freelancer'),
        city: f.region ?? '—',
        rating: f.avg_rating ?? 0,
        reviews: f.review_count ?? 0,
        price: f.min_price ?? 0,
      }))
    : []

  const reviewAbout = (name: string) => t('review_about_freelancer').replace('{name}', name)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] gradient-hero overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-bounce-gentle" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative container-responsive min-h-[90vh] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
            {/* Left content */}
            <div className="space-y-8 animate-fadeInUp">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight text-balance">
                {t('hero_title')}
              </h1>
              <p className="text-xl text-white/90 text-pretty">
                {t('hero_sub')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push(PATHS.services)}
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90 font-semibold text-lg px-8 hover-scale"
                >
                  {t('btn_find_work')}
                </Button>
                <Button
                  onClick={() => router.push(PATHS.postProject)}
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white text-white hover:bg-white/20 hover:text-white font-semibold text-lg px-8 hover-scale"
                >
                  {t('btn_give_work')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="pt-8 space-y-3">
                <p className="text-sm text-white/70 font-medium">{t('trust_with')}</p>
                <div className="flex flex-wrap gap-4">
                  {heroTrustBadges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                      <badge.icon className="w-4 h-4 text-white" strokeWidth={2} />
                      <span className="text-sm text-white">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - App preview mockup */}
            <div className="hidden lg:flex justify-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-40 animate-pulse" />
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 ring-1 ring-black/5">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-100/90 border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 mx-2 h-6 bg-white rounded-md border border-slate-200 flex items-center px-2 gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[10px] text-slate-500 truncate">ishbor.uz</span>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                          <Briefcase className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-tight">IshBor.uz</p>
                          <p className="text-[10px] text-slate-500 truncate">{t('marketplace_tagline')}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        Live
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { icon: LayoutDashboard, label: stats.projects > 0 ? String(stats.projects) : '0', sub: t('stats_projects') },
                        { icon: TrendingUp, label: stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '—', sub: t('stats_rating') },
                        { icon: Users, label: stats.clients > 0 ? `${stats.clients}` : '0', sub: t('stats_clients') },
                      ].map((item, i) => (
                        <div key={i} className="relative bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center overflow-hidden group">
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60" />
                          <item.icon className="w-4 h-4 text-indigo-600 mx-auto mb-1" strokeWidth={2} />
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{item.label}</p>
                          <p className="text-[9px] text-slate-500 leading-tight line-clamp-1">{item.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-lg">
                      {heroTabs.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setHeroTab(id)}
                          className={`flex-1 text-center text-[9px] font-medium py-1 rounded-md transition-colors ${
                            heroTab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="space-y-2">
                      {heroTab === 'services' && (
                        <>
                          {heroServices.length > 0 ? (
                            heroServices.map((svc) => {
                              const profile = svc.profiles as { full_name?: string } | null | undefined
                              const color = categoryColors[svc.category] ?? 'bg-indigo-500'
                              return (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => router.push(servicePath(svc.id))}
                                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                                >
                                  <div className={`w-9 h-9 rounded-lg ${color} shrink-0 flex items-center justify-center shadow-sm`}>
                                    <Star className="w-4 h-4 text-white" strokeWidth={2} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                      {svc.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {formatPrice(svc.price)}
                                      {profile?.full_name ? ` · ${profile.full_name}` : ''}
                                    </p>
                                  </div>
                                  <div className="flex gap-0.5 shrink-0">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>
                                </button>
                              )
                            })
                          ) : (
                            <div className="bg-white/80 rounded-xl p-4 text-center border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500">{t('no_services_yet')}</p>
                            </div>
                          )}
                        </>
                      )}

                      {heroTab === 'projects' && (
                        <>
                          {heroProjects.length > 0 ? (
                            heroProjects.map((project) => {
                              const profile = project.profiles as { full_name?: string; region?: string } | null | undefined
                              return (
                                <button
                                  key={project.id}
                                  type="button"
                                  onClick={() => router.push(PATHS.postProject)}
                                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                                >
                                  <div className="w-9 h-9 rounded-lg bg-emerald-500 shrink-0 flex items-center justify-center shadow-sm">
                                    <LayoutDashboard className="w-4 h-4 text-white" strokeWidth={2} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                      {project.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {formatPrice(project.budget)}
                                      {profile?.region ? ` · ${profile.region}` : ''}
                                    </p>
                                  </div>
                                  <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                                    {t('active_status')}
                                  </span>
                                </button>
                              )
                            })
                          ) : (
                            <div className="bg-white/80 rounded-xl p-4 text-center border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500">{t('post_your_project')}</p>
                            </div>
                          )}
                        </>
                      )}

                      {heroTab === 'rating' && (
                        <>
                          {reviews.length > 0 ? (
                            reviews.slice(0, 3).map((review) => (
                              <button
                                key={review.id}
                                type="button"
                                onClick={() => router.push(freelancerPath(review.freelancer_id))}
                                className="w-full flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                              >
                                <div className="w-9 h-9 rounded-lg bg-amber-400 shrink-0 flex items-center justify-center shadow-sm">
                                  <Star className="w-4 h-4 text-white fill-white" strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex gap-0.5 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-2.5 h-2.5 ${
                                          s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-snug">
                                    &ldquo;{review.comment}&rdquo;
                                  </p>
                                  <p className="text-[9px] text-slate-400 mt-1 truncate">
                                    {review.author_name}
                                    {review.freelancer_name ? ` · ${review.freelancer_name}` : ''}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="bg-white/80 rounded-xl p-4 text-center border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500">{t('testimonials_empty')}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-b from-background to-secondary/50">
        <div className="container-responsive">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {[
              { label: t('stats_freelancers'), value: counters.freelancers, suffix: counters.freelancers > 0 ? '+' : '', showStar: false },
              { label: t('stats_clients'), value: counters.clients, suffix: counters.clients > 0 ? '+' : '', showStar: false },
              { label: t('stats_projects'), value: counters.projects, suffix: counters.projects > 0 ? '+' : '', showStar: false },
              { label: t('stats_rating'), value: counters.rating > 0 ? counters.rating.toFixed(1) : '—', suffix: '', showStar: counters.rating > 0 },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="relative glass rounded-2xl p-6 lg:p-8 text-center animate-fadeInUp overflow-hidden group hover-lift"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-3xl lg:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-1 tabular-nums">
                  {stat.value}{stat.suffix}
                  {stat.showStar && <Star className="w-6 lg:w-8 h-6 lg:h-8 fill-amber-400 text-amber-400 inline" />}
                </p>
                <p className="text-sm lg:text-base text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-20 bg-background">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            {t('categories_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon
              return (
              <div
                key={cat.id}
                className="group glass rounded-2xl p-8 text-center hover-lift cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => router.push(PATHS.services)}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} text-white mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition">
                  {cat.count} {t('services_count_suffix')}
                </p>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-secondary/30">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            {t('how_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line — aligned to step circle centers (h-16 → center at 2rem) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-8 left-[16.666%] right-[16.666%] h-0.5 -z-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
            />

            {[
              { step: '1', title: t('step1'), desc: t('step1_desc') },
              { step: '2', title: t('step2'), desc: t('step2_desc') },
              { step: '3', title: t('step3'), desc: t('step3_desc') }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 animate-fadeInUp" style={{ animationDelay: `${idx * 0.15}s` }}>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-2xl shadow-md ring-4 ring-secondary/30">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Freelancers */}
      <div className="py-20 bg-background">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold mb-16 text-balance">
            {t('featured_freelancers')}
          </h2>
          {featuredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFreelancers.map((freelancer, idx) => (
              <div
                key={freelancer.id}
                className="glass rounded-2xl overflow-hidden hover-lift cursor-pointer group animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => router.push(freelancerPath(freelancer.id))}
              >
                {/* Avatar placeholder */}
                <div className="h-40 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                  {freelancer.name[0]}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{freelancer.name}</h3>
                    <p className="text-sm text-muted-foreground">{freelancer.specialty}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{freelancer.city}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= Math.round(freelancer.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground ml-auto">
                      {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : '—'} ({freelancer.reviews})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">{t('service_from')}</p>
                    <p className="text-2xl font-bold text-accent">
                      {freelancer.price > 0 ? formatPrice(freelancer.price) : '—'}
                    </p>
                  </div>

                  <Button className="w-full" variant="outline">
                    {t('view')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('no_freelancers_yet')}</p>
          )}
        </div>
      </div>

      {/* Why IshBor vs Kwork */}
      <div className="py-20 bg-secondary/30">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance">
            {t('why_title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="px-6 py-4 text-left font-bold">{t('comparison_feature')}</th>
                  <th className="px-6 py-4 font-bold text-indigo-600">{t('comparison_ishbor')}</th>
                  <th className="px-6 py-4 font-bold text-gray-500">{t('comparison_kwork')}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="px-6 py-4 text-left font-medium">{feat.feature}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{feat.ishbor}</td>
                    <td className="px-6 py-4 text-gray-500">{feat.kwork}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials — real reviews from DB */}
      <div className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container-responsive">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold text-balance">{t('testimonials_title')}</h2>
            {stats.avg_rating > 0 && stats.review_count > 0 && (
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground tabular-nums">{stats.avg_rating.toFixed(1)}</span>
                <span>· {t('stat_n_reviews').replace('{n}', String(stats.review_count))}</span>
              </p>
            )}
          </div>

          {reviewsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-8 animate-pulse space-y-4">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-10 w-32 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-muted-foreground max-w-lg mx-auto">{t('testimonials_empty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, idx) => {
                const dateLabel = formatReviewDate(review.created_at)
                return (
                  <article
                    key={review.id}
                    className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-fadeInUp flex flex-col"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <Quote className="absolute top-5 right-5 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                    <StarRating rating={review.rating} />
                    <p className="mt-4 text-foreground leading-relaxed flex-1 line-clamp-5">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initials(review.author_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{review.author_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {review.author_role === 'client' ? t('role_client_label') : t('role_freelancer')}
                          {review.freelancer_name ? ` · ${reviewAbout(review.freelancer_name)}` : ''}
                        </p>
                      </div>
                    </div>
                    {(review.freelancer_specialty || dateLabel) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {review.freelancer_specialty && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{review.freelancer_specialty}</span>
                        )}
                        {dateLabel && <span>{dateLabel}</span>}
                      </div>
                    )}
                    {review.freelancer_id && (
                      <button
                        type="button"
                        onClick={() => router.push(freelancerPath(review.freelancer_id))}
                        className="mt-4 text-sm font-medium text-primary hover:underline text-left"
                      >
                        {t('view')} →
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Telegram Bot Banner */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white space-y-2">
              <h3 className="text-3xl font-bold">{t('telegram_title')}</h3>
              <p className="text-white/90">{t('telegram_subtitle')}</p>
            </div>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
              {t('connect')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
