import type { TranslationKey } from '@/infrastructure/i18n'

export interface ServiceSubcategory {
  labelKey: TranslationKey
  cat: string
}

export interface ServiceMegaCategory {
  id: string
  labelKey: TranslationKey
  cat: string
  subcategories: ServiceSubcategory[]
}

export const SERVICE_MEGA_CATEGORIES: ServiceMegaCategory[] = [
  {
    id: 'design',
    labelKey: 'kwork_cat_design',
    cat: 'graphic',
    subcategories: [
      { labelKey: 'mega_sub_logo', cat: 'graphic' },
      { labelKey: 'mega_sub_uiux', cat: 'uiux' },
      { labelKey: 'mega_sub_social_design', cat: 'graphic' },
      { labelKey: 'mega_sub_banner', cat: 'graphic' },
      { labelKey: 'mega_sub_illustration', cat: 'graphic' },
      { labelKey: 'mega_sub_presentation', cat: 'graphic' },
    ],
  },
  {
    id: 'dev',
    labelKey: 'kwork_cat_dev',
    cat: 'web',
    subcategories: [
      { labelKey: 'mega_sub_website', cat: 'web' },
      { labelKey: 'mega_sub_landing', cat: 'web' },
      { labelKey: 'mega_sub_mobile', cat: 'mobile' },
      { labelKey: 'mega_sub_wordpress', cat: 'web' },
      { labelKey: 'mega_sub_bot', cat: 'web' },
      { labelKey: 'mega_sub_it_support', cat: 'web' },
    ],
  },
  {
    id: 'writing',
    labelKey: 'kwork_cat_writing',
    cat: 'writing',
    subcategories: [
      { labelKey: 'mega_sub_copywriting', cat: 'writing' },
      { labelKey: 'mega_sub_articles', cat: 'writing' },
      { labelKey: 'mega_sub_translation', cat: 'writing' },
      { labelKey: 'mega_sub_proofread', cat: 'writing' },
      { labelKey: 'mega_sub_smm_text', cat: 'writing' },
      { labelKey: 'mega_sub_technical_doc', cat: 'writing' },
    ],
  },
  {
    id: 'seo',
    labelKey: 'kwork_cat_seo',
    cat: 'seo',
    subcategories: [
      { labelKey: 'mega_sub_seo_audit', cat: 'seo' },
      { labelKey: 'mega_sub_keywords', cat: 'seo' },
      { labelKey: 'mega_sub_linkbuilding', cat: 'seo' },
      { labelKey: 'mega_sub_local_seo', cat: 'seo' },
      { labelKey: 'mega_sub_analytics', cat: 'seo' },
      { labelKey: 'mega_sub_seo_content', cat: 'seo' },
    ],
  },
  {
    id: 'smm',
    labelKey: 'kwork_cat_smm',
    cat: 'smm',
    subcategories: [
      { labelKey: 'mega_sub_smm_strategy', cat: 'smm' },
      { labelKey: 'mega_sub_target_ads', cat: 'smm' },
      { labelKey: 'mega_sub_community', cat: 'smm' },
      { labelKey: 'mega_sub_influencer', cat: 'smm' },
      { labelKey: 'mega_sub_content_plan', cat: 'smm' },
      { labelKey: 'mega_sub_brand_smm', cat: 'smm' },
    ],
  },
  {
    id: 'video',
    labelKey: 'kwork_cat_video',
    cat: 'video',
    subcategories: [
      { labelKey: 'mega_sub_video_edit', cat: 'video' },
      { labelKey: 'mega_sub_motion', cat: 'video' },
      { labelKey: 'mega_sub_intro', cat: 'video' },
      { labelKey: 'mega_sub_reels', cat: 'video' },
      { labelKey: 'mega_sub_color_audio', cat: 'video' },
      { labelKey: 'mega_sub_animation', cat: 'video' },
    ],
  },
  {
    id: 'business',
    labelKey: 'kwork_cat_business',
    cat: 'design',
    subcategories: [
      { labelKey: 'mega_sub_consulting', cat: 'design' },
      { labelKey: 'mega_sub_market_research', cat: 'design' },
      { labelKey: 'mega_sub_finance', cat: 'design' },
      { labelKey: 'mega_sub_hr', cat: 'design' },
      { labelKey: 'mega_sub_legal', cat: 'design' },
      { labelKey: 'mega_sub_biz_present', cat: 'design' },
    ],
  },
]

export function splitMegaColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}
