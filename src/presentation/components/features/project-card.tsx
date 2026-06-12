'use client'

import Link from 'next/link'
import { Briefcase, ChevronRight, MapPin, Shield, Users } from 'lucide-react'
import { Badge } from '@/presentation/components/ui/badge'
import { useApp } from '@/application/providers/app-provider'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { StatusBadgeVariant } from '@/shared/lib/marketplace-status'

export interface ProjectCardProps {
  href: string
  title: string
  description: string
  budget: number
  region: string
  categoryLabel: string
  statusLabel: string
  statusVariant?: StatusBadgeVariant
  applicationCount?: number
  className?: string
}

export function ProjectCard({
  href,
  title,
  description,
  budget,
  region,
  categoryLabel,
  statusLabel,
  statusVariant = 'default',
  applicationCount = 0,
  className,
}: ProjectCardProps) {
  const { t } = useApp()

  return (
    <Link href={href} className={cn('project-catalog-card group block', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-bold text-[var(--ishbor-text)] transition group-hover:text-[var(--color-primary)]">
              {title}
            </h2>
            <Badge variant={statusVariant} size="xs">
              {statusLabel}
            </Badge>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[var(--ishbor-text-muted)]">
            {description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[var(--ishbor-text-sub)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--ishbor-text-muted)]" aria-hidden />
              {region}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-[var(--ishbor-text-muted)]" aria-hidden />
              {categoryLabel}
            </span>
            {applicationCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('project_applications_count').replace('{n}', String(applicationCount))}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[var(--ishbor-text-muted)]">
              <Shield className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" aria-hidden />
              {t('card_escrow_protected')}
            </span>
          </div>
        </div>
        <div className="project-catalog-card__aside">
          <div className="project-catalog-card__budget-pill">
            <span className="project-catalog-card__budget-label">{t('project_budget')}</span>
            <span className="project-catalog-card__budget">{formatPrice(budget)}</span>
          </div>
          <span className="project-catalog-card__cta">
            {t('project_card_apply_hint')}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
