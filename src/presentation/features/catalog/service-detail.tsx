'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Badge } from '@/presentation/components/ui/badge'
import { RatingStars } from '@/presentation/components/ui/rating-stars'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import {
  MapPin,
  Clock,
  Shield,
  MessageCircle,
  Bookmark,
} from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiService, ApiReview } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { dashboardOrderPath, freelancerPath, PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { JsonLdBreadcrumb, JsonLdService } from '@/presentation/components/seo/json-ld'
import { isServiceSaved, syncSavedServicesFromApi, toggleSavedService } from '@/shared/lib/saved-items'
import { toast } from '@/presentation/components/ui/toast'
import Image from 'next/image'
import { ServiceCard } from '@/presentation/components/features/service-card'
import { initialsFromName } from '@/shared/lib/avatar'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
}

export function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const { t, isLoggedIn, currentUserRole, userId } = useApp()
  const router = useRouter()
  const [service, setService] = useState<ApiService | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')
  const [activePackage, setActivePackage] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [activeThumb, setActiveThumb] = useState(0)
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [saved, setSaved] = useState(false)
  const [related, setRelated] = useState<ApiService[]>([])
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const orderModalRef = useRef<HTMLDivElement>(null)

  useEscapeClose(orderModalOpen, () => setOrderModalOpen(false))
  useFocusTrap(orderModalOpen, orderModalRef)
  useBodyScrollLock(orderModalOpen)

  useEffect(() => {
    api
      .getService(serviceId)
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false))
    api.recordServiceView(serviceId).catch(() => undefined)
  }, [serviceId])

  useEffect(() => {
    if (!service?.freelancer_id) return
    api
      .listServiceReviews(serviceId)
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [serviceId])

  useEffect(() => {
    if (!isLoggedIn) return
    syncSavedServicesFromApi().then(() => setSaved(isServiceSaved(serviceId)))
  }, [isLoggedIn, serviceId])

  useEffect(() => {
    if (!service) return
    api
      .listServices({ category: service.category })
      .then((res) => setRelated(res.items.filter((s) => s.id !== service.id).slice(0, 4)))
      .catch(() => setRelated([]))
  }, [service])

  const deliveryDays = service?.delivery_days && service.delivery_days > 0 ? service.delivery_days : null

  const packages = useMemo(() => {
    if (!service) return []
    const apiPkgs = service.packages?.filter((p) => p?.id && p.price > 0)
    if (apiPkgs && apiPkgs.length > 0) {
      return apiPkgs.map((p) => ({
        id: p.id as 'basic' | 'standard' | 'premium',
        labelKey: (p.label_key || 'package_basic') as TranslationKey,
        price: p.price,
        days: p.delivery_days > 0 ? p.delivery_days : deliveryDays,
      }))
    }
    return [
      {
        id: 'basic' as const,
        labelKey: 'package_basic' as TranslationKey,
        price: service.price,
        days: deliveryDays,
      },
    ]
  }, [service, deliveryDays])

  const selectedPackage = packages.find((p) => p.id === activePackage) ?? packages[0]
  type GalleryItem = { id: number; url: string } | { id: number; ch: string }

  const galleryItems = useMemo((): GalleryItem[] => {
    if (!service) return []
    if (service.image_urls && service.image_urls.length > 0) {
      return service.image_urls.map((url, i) => ({ id: i, url }))
    }
    return [{ id: 0, ch: service.title.charAt(0).toUpperCase() || '?' }]
  }, [service])

  const handleToggleSave = async () => {
    if (!isLoggedIn) {
      router.push(loginPath(`/services/${serviceId}`))
      return
    }
    const next = await toggleSavedService(serviceId)
    setSaved(next)
    toast.success(next ? t('saved') : t('unsave'))
  }

  const handleContact = async () => {
    if (!isLoggedIn) {
      router.push(loginPath(`/services/${serviceId}`))
      return
    }
    const orders = await api.listOrders().catch(() => [])
    const existing = orders.find(
      (o) =>
        o.freelancer_id === service?.freelancer_id &&
        ['pending', 'active', 'delivered', 'disputed'].includes(o.status)
    )
    if (existing) {
      router.push(`${PATHS.dashboardMessages}?order=${existing.id}`)
      return
    }
    if (currentUserRole !== 'client') {
      setError(t('client_only_order'))
      return
    }
    setOrderNotes('')
    setOrderModalOpen(true)
  }

  const handleOrder = () => {
    if (!isLoggedIn) {
      router.push(loginPath(`/services/${serviceId}`))
      return
    }
    if (currentUserRole !== 'client') {
      setError(t('client_only_order'))
      return
    }
    setOrderModalOpen(true)
  }

  const submitOrder = async () => {
    setOrdering(true)
    setError('')
    try {
      const created = await api.createOrder(
        serviceId,
        orderNotes.trim() || undefined,
        selectedPackage?.id
      )
      setOrderModalOpen(false)
      setOrderNotes('')
      router.push(dashboardOrderPath(created.id))
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('error_required')
      setError(msg.includes('faol buyurtma') ? t('order_duplicate_error') : msg)
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6 animate-pulse">
            <div className="aspect-[16/10] rounded-[var(--r-card)] bg-[var(--color-bg-muted)]" />
            <div className="h-8 w-2/3 rounded bg-[var(--color-bg-muted)]" />
            <div className="h-4 w-1/2 rounded bg-[var(--color-bg-muted)]" />
            <div className="h-32 rounded-[var(--r-card)] bg-[var(--color-bg-muted)]" />
          </div>
          <div className="hide-mobile space-y-4">
            <div className="h-56 rounded-[var(--r-card)] bg-[var(--color-bg-muted)]" />
            <div className="h-40 rounded-[var(--r-card)] bg-[var(--color-bg-muted)]" />
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!service) {
    return (
      <PageWrapper>
        <EmptyState
          icon={<Shield />}
          title={t('service_not_found_title')}
          description={t('service_not_found_desc')}
          action={{ label: t('nav_services'), onClick: () => router.push(PATHS.services) }}
        />
      </PageWrapper>
    )
  }

  const freelancerName = service.profiles?.full_name ?? t('freelancer')
  const isOwnService = userId === service.freelancer_id
  const categoryKey = CATEGORY_KEYS[service.category]
  const serviceRating = service.profiles?.avg_rating ?? 0
  const serviceReviews = service.profiles?.review_count ?? 0

  const orderButton = (
    <Button
      variant="primary"
      size="lg"
      className="kwork-order-cta"
      onClick={handleOrder}
      disabled={ordering || isOwnService}
      loading={ordering}
    >
      {t('order_secure_cta')}
    </Button>
  )

  return (
    <>
      <JsonLdService
        id={service.id}
        title={service.title}
        description={service.description}
        price={selectedPackage?.price ?? service.price}
        imageUrl={service.image_urls?.[0]}
        freelancerName={service.profiles?.full_name}
      />
      <JsonLdBreadcrumb
        items={[
          { name: t('home'), path: PATHS.home },
          { name: t('nav_services'), path: PATHS.services },
          { name: service.title, path: `/services/${service.id}` },
        ]}
      />
      <PageWrapper className="service-detail-page">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: t('home'), href: PATHS.home },
            { label: t('nav_services'), href: PATHS.services },
            { label: service.title },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <div className="service-gallery">
              <div className="service-gallery-main relative aspect-[16/10] overflow-hidden rounded-[var(--r-card)] border border-[var(--kwork-border)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)]">
                {galleryItems[activeThumb] && 'url' in galleryItems[activeThumb] ? (
                  <Image
                    src={galleryItems[activeThumb].url}
                    alt={service.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[48px] font-bold text-[var(--color-primary)]/25">
                    {galleryItems[activeThumb] && 'ch' in galleryItems[activeThumb]
                      ? galleryItems[activeThumb].ch
                      : service.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {galleryItems.length > 1 && (
                <div className="service-gallery-thumbs">
                  {galleryItems.map((thumb) => (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => setActiveThumb(thumb.id)}
                      className={cn(
                        'service-gallery-thumb relative',
                        activeThumb === thumb.id && 'service-gallery-thumb--active'
                      )}
                    >
                      {'url' in thumb ? (
                        <Image src={thumb.url} alt="" fill sizes="80px" className="object-cover" />
                      ) : (
                        thumb.ch
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {packages.length > 1 && (
              <div className="show-mobile">
                <div className="service-package-tabs mb-4">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setActivePackage(pkg.id)}
                      className={cn(
                        'service-package-tab',
                        activePackage === pkg.id && 'service-package-tab--active'
                      )}
                    >
                      {t(pkg.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-[22px] font-bold leading-snug text-[var(--kwork-text)] md:text-[28px]">
                  {service.title}
                </h1>
                {isLoggedIn && currentUserRole === 'client' && (
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--kwork-border)] text-[var(--kwork-text-muted)] hover:text-[var(--color-primary)]"
                    aria-label={saved ? t('unsave') : t('save')}
                  >
                    <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[var(--kwork-text-muted)]">
                {serviceReviews > 0 ? (
                  <button
                    type="button"
                    onClick={() => document.getElementById('service-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hover:opacity-80"
                  >
                    <RatingStars
                      rating={serviceRating}
                      showValue
                      reviewCount={serviceReviews}
                      reviewLabel={t('reviews_count_short')}
                    />
                  </button>
                ) : (
                  <span className="text-[var(--kwork-text-muted)]">{t('no_reviews_yet')}</span>
                )}
                {categoryKey && (
                  <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 font-medium text-[var(--color-primary)]">
                    {t(categoryKey)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {service.region}
                </span>
                {deliveryDays != null && deliveryDays > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t('service_delivery_days').replace('{n}', String(deliveryDays))}
                  </span>
                )}
              </div>
            </div>

            <section className="kwork-card p-5">
              <h2 className="mb-3 text-[16px] font-semibold text-[var(--kwork-text)]">
                {t('service_description')}
              </h2>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--kwork-text-muted)]">
                {service.description}
              </p>
            </section>

            {reviews.length > 0 && (
              <section id="service-reviews" className="kwork-card p-5">
                <h2 className="mb-4 text-[16px] font-semibold text-[var(--kwork-text)]">{t('service_reviews_title')}</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 6).map((r) => (
                    <div key={r.id} className="border-b border-[var(--kwork-border)] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold text-[var(--kwork-text)]">{r.profiles?.full_name ?? '—'}</p>
                        <RatingStars rating={r.rating} size="sm" />
                      </div>
                      {r.comment && <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="show-mobile">
              <div className="service-seller-card">
                <p className="service-seller-label">{t('freelancer')}</p>
                <button
                  type="button"
                  onClick={() => router.push(freelancerPath(service.freelancer_id))}
                  className="service-seller-profile"
                >
                  <Avatar name={freelancerName} size={48} />
                  <div className="service-seller-info">
                    <div className="service-seller-name-row">
                      <p className="service-seller-name">{freelancerName}</p>
                    </div>
                    <p className="service-seller-specialty">
                      {service.profiles?.specialty ?? t('role_freelancer')}
                    </p>
                    {serviceReviews > 0 && (
                      <RatingStars rating={serviceRating} size="sm" className="mt-2" />
                    )}
                  </div>
                </button>
                <div className="service-seller-divider" />
                <Link href={freelancerPath(service.freelancer_id)} className="service-seller-link">
                  {t('view_profile_link')} →
                </Link>
                {isLoggedIn && !isOwnService && (
                  <div className="service-seller-contact space-y-3">
                    <Button
                      variant="outline"
                      size="md"
                      className="min-h-11 w-full"
                      leftIcon={<MessageCircle className="h-4 w-4" />}
                      onClick={handleContact}
                    >
                      {t('contact_freelancer')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="service-sidebar-sticky hide-mobile space-y-4">
            <div className="kwork-card service-order-card p-5">
              {packages.length > 1 && (
              <div className="service-package-tabs">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setActivePackage(pkg.id)}
                    className={cn(
                      'service-package-tab',
                      activePackage === pkg.id && 'service-package-tab--active'
                    )}
                  >
                    {t(pkg.labelKey)}
                  </button>
                ))}
              </div>
              )}
              <p className={cn('text-[13px] text-[var(--kwork-text-muted)]', packages.length > 1 ? 'mt-4' : '')}>{t('starting_at')}</p>
              <p className="service-price-lg mt-1">
                {formatPrice(selectedPackage?.price ?? service.price)}
              </p>
              {(selectedPackage?.days ?? deliveryDays) != null &&
                (selectedPackage?.days ?? deliveryDays)! > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--kwork-text-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    {t('service_delivery_days').replace(
                      '{n}',
                      String(selectedPackage?.days ?? deliveryDays)
                    )}
                  </p>
                )}

              {error && (
                <Alert variant="error" className="mt-3">
                  {error}
                </Alert>
              )}

              {!isOwnService && <div className="mt-4">{orderButton}</div>}

              <Alert variant="info" className="mt-4 flex items-center gap-2 text-[12px]">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t('escrow_after_payment')}</span>
              </Alert>
            </div>

            <div className="service-seller-card">
              <p className="service-seller-label">{t('freelancer')}</p>

              <button
                type="button"
                onClick={() => router.push(freelancerPath(service.freelancer_id))}
                className="service-seller-profile"
              >
                <Avatar name={freelancerName} size={48} />
                <div className="service-seller-info">
                  <div className="service-seller-name-row">
                    <p className="service-seller-name">{freelancerName}</p>
                  </div>
                  <p className="service-seller-specialty">
                    {service.profiles?.specialty ?? t('role_freelancer')}
                  </p>
                  {serviceReviews > 0 && (
                    <RatingStars rating={serviceRating} size="sm" className="mt-2" />
                  )}
                </div>
              </button>

              <div className="service-seller-divider" />

              <Link href={freelancerPath(service.freelancer_id)} className="service-seller-link">
                {t('view_profile_link')} →
              </Link>

              {isLoggedIn && !isOwnService && (
                <div className="service-seller-contact space-y-3">
                  <p className="text-[11px] leading-relaxed text-[var(--kwork-text-muted)]">
                    {t('contact_requires_order')}
                  </p>
                  <Button
                    variant="outline"
                    size="md"
                    className="min-h-11 w-full"
                    leftIcon={<MessageCircle className="h-4 w-4" />}
                    onClick={handleContact}
                  >
                    {t('contact_freelancer')}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-[16px] font-semibold text-[var(--kwork-text)]">{t('related_services_title')}</h2>
            <div className="kwork-grid">
              {related.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  title={svc.title}
                  sellerName={svc.profiles?.full_name ?? t('freelancer')}
                  sellerInitials={initialsFromName(svc.profiles?.full_name ?? 'F')}
                  rating={svc.profiles?.avg_rating ?? 0}
                  reviewCount={svc.profiles?.review_count ?? 0}
                  price={svc.price}
                  category={svc.category}
                  onClick={() => router.push(`/services/${svc.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </PageWrapper>

      {orderModalOpen && (
        <div
          className="kwork-order-modal-backdrop"
          role="presentation"
          onClick={() => setOrderModalOpen(false)}
        >
          <div
            ref={orderModalRef}
            className="kwork-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="order-modal-title" className="kwork-order-modal__head">
              {t('order_notes_label')}
            </h3>
            <p className="kwork-order-modal__price">
              {selectedPackage ? t(selectedPackage.labelKey) : t('package_basic')} ·{' '}
              <strong>{formatPrice(selectedPackage?.price ?? service.price)}</strong>
            </p>
            <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{t('payment_required_hint')}</p>
            <p className="mt-1 text-[11px] text-[var(--kwork-text-muted)]">{t('commission_zero')}</p>
            <div className="kwork-order-modal__body">
              <Textarea
                rows={4}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={t('order_notes_ph')}
              />
            </div>
            <div className="kwork-order-modal__foot">
              <Button variant="outline" fullWidth onClick={() => setOrderModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button variant="primary" fullWidth loading={ordering} onClick={submitOrder} className="kwork-order-cta">
                {t('order_secure_cta')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isOwnService && (
        <div className="mobile-sticky-cta show-mobile">
          <button
            type="button"
            onClick={() => router.push(freelancerPath(service.freelancer_id))}
            className="flex min-w-0 max-w-[48%] items-center gap-2 text-left"
          >
            <Avatar name={freelancerName} size={36} verified={service.profiles?.is_verified} />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[var(--kwork-text)]">{freelancerName}</p>
              {serviceReviews > 0 && (
                <RatingStars rating={serviceRating} size="sm" />
              )}
            </div>
          </button>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[11px] text-[var(--kwork-text-muted)]">{t('starting_at')}</span>
            <span className="text-[18px] font-bold tabular-nums text-[var(--kwork-text)]">
              {formatPrice(selectedPackage?.price ?? service.price)}
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleOrder}
            disabled={ordering}
            loading={ordering}
            className="kwork-order-cta shrink-0 !w-auto px-6"
          >
            {t('order_secure_cta')}
          </Button>
        </div>
      )}
    </>
  )
}
