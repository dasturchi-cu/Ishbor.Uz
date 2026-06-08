'use client'

import Link from 'next/link'
import {
  Palette,
  Code2,
  PenLine,
  TrendingUp,
  Megaphone,
  Video,
  Briefcase,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { SERVICE_MEGA_CATEGORIES } from '@/domain/constants/service-categories'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'

const CATEGORY_ACCENTS: Record<string, { bg: string; icon: string }> = {
  graphic: { bg: '#FDF2F8', icon: '#DB2777' },
  web: { bg: '#EFF6FF', icon: '#2563EB' },
  writing: { bg: '#F0FDF4', icon: '#16A34A' },
  seo: { bg: '#FFF7ED', icon: '#EA580C' },
  smm: { bg: '#F5F3FF', icon: '#7C3AED' },
  video: { bg: '#ECFEFF', icon: '#0891B2' },
  business: { bg: '#F1F5F9', icon: '#475569' },
}

const SLUG_TO_MEGA_ID: Record<string, string> = {
  graphic: 'design',
  web: 'dev',
  writing: 'writing',
  seo: 'seo',
  smm: 'smm',
  video: 'video',
  business: 'business',
}

export const KWORK_CATEGORY_ITEMS: {
  slug: string
  cat: string
  icon: LucideIcon
  labelKey: TranslationKey
}[] = [
  { slug: 'graphic', cat: 'graphic', icon: Palette, labelKey: 'kwork_cat_design' },
  { slug: 'web', cat: 'web', icon: Code2, labelKey: 'kwork_cat_dev' },
  { slug: 'writing', cat: 'writing', icon: PenLine, labelKey: 'kwork_cat_writing' },
  { slug: 'seo', cat: 'seo', icon: TrendingUp, labelKey: 'kwork_cat_seo' },
  { slug: 'smm', cat: 'smm', icon: Megaphone, labelKey: 'kwork_cat_smm' },
  { slug: 'video', cat: 'video', icon: Video, labelKey: 'kwork_cat_video' },
  { slug: 'business', cat: 'design', icon: Briefcase, labelKey: 'kwork_cat_business' },
]

export function slugFromCategory(cat: string | null | undefined): string | undefined {
  if (!cat) return undefined
  return KWORK_CATEGORY_ITEMS.find((item) => item.cat === cat)?.slug
}

export interface CategoryIconRowProps {
  activeCategory?: string | null
  className?: string
  onCategorySelect?: (cat: string) => void
}

export function CategoryIconRow({
  activeCategory,
  className,
  onCategorySelect,
}: CategoryIconRowProps) {
  const { t } = useApp()
  const router = useRouter()
  const activeSlug = slugFromCategory(activeCategory ?? undefined)

  const handleSelect = (cat: string) => {
    if (onCategorySelect) {
      onCategorySelect(cat)
      return
    }
    router.push(`${PATHS.services}?cat=${encodeURIComponent(cat)}`)
  }

  return (
    <div className={cn('category-icon-scroll', className)}>
      {KWORK_CATEGORY_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeSlug === item.slug
        const accent = CATEGORY_ACCENTS[item.slug] ?? CATEGORY_ACCENTS.web
        const mega = SERVICE_MEGA_CATEGORIES.find((m) => m.id === SLUG_TO_MEGA_ID[item.slug])

        return (
          <div key={item.slug} className="group/cat relative shrink-0 sm:min-w-0">
            <button
              type="button"
              onClick={() => handleSelect(item.cat)}
              className={cn('category-chip', isActive && 'category-chip--active')}
            >
              <span
                className="category-chip__icon"
                style={{ backgroundColor: accent.bg, color: accent.icon }}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
              <span className="category-chip__label">{t(item.labelKey)}</span>
            </button>

            {mega && mega.subcategories.length > 0 && (
              <div className="category-mega-popover pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-50 hidden -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/cat:pointer-events-auto group-hover/cat:opacity-100 sm:block">
                <div className="category-mega-panel">
                  <div className="category-mega-links">
                    {mega.subcategories.map((sub) => (
                      <Link
                        key={sub.labelKey}
                        href={`${PATHS.services}?cat=${encodeURIComponent(sub.cat)}`}
                        className="category-mega-link"
                        onClick={() => onCategorySelect?.(sub.cat)}
                      >
                        {t(sub.labelKey)}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`${PATHS.services}?cat=${encodeURIComponent(item.cat)}`}
                    className="category-mega-all"
                    onClick={() => onCategorySelect?.(item.cat)}
                  >
                    {t('view_all')}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
