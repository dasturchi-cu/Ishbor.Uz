import { api } from '@/infrastructure/api/client'
import type { Language } from '@/infrastructure/i18n'

export type AiSuggestKind =
  | 'project_description'
  | 'service_description'
  | 'service_title'
  | 'profile_bio'
  | 'cover_letter'

export type AiSuggestContext = {
  title?: string
  category?: string
  skills?: string[]
  region?: string
  project_description?: string
  specialty?: string
  language?: Language
}

export async function fetchAiSuggestion(
  kind: AiSuggestKind,
  context: AiSuggestContext
): Promise<string> {
  try {
    const res = await api.aiSuggest({ kind, ...context, language: context.language ?? 'uz' })
    return res.text
  } catch {
    return localAiSuggestion(kind, context)
  }
}

function localAiSuggestion(kind: AiSuggestKind, ctx: AiSuggestContext): string {
  const lang = ctx.language ?? 'uz'
  const title = ctx.title?.trim() || (lang === 'en' ? 'Project' : 'Loyiha')
  if (kind === 'service_title') {
    const cat = ctx.category || 'web'
    if (lang === 'en') return `Professional ${cat} service`
    return `Professional ${cat} xizmati`
  }
  if (kind === 'profile_bio') {
    const spec = ctx.specialty?.trim() || title
    if (lang === 'en') return `I'm a ${spec}. I deliver on time with clear milestones.`
    return `Men ${spec} — muddatga rioya qilib, bosqichma-bosqich ishlayman.`
  }
  if (kind === 'cover_letter') {
    const spec = ctx.specialty?.trim() || 'freelancer'
    if (lang === 'ru') {
      return `Здравствуйте! Я ${spec} и хочу работать над «${title}». Готов(а) обсудить этапы и сроки.`
    }
    if (lang === 'en') {
      return `Hello! I'm a ${spec} interested in «${title}». Happy to share a milestone plan and timeline.`
    }
    return `Assalomu alaykum! Men ${spec} sifatida «${title}» loyihasiga ariza bermoqchiman. Muddat va bosqichlarni muhokama qilaman.`
  }
  const cat = ctx.category || 'web'
  if (kind === 'service_description') {
    if (lang === 'en') {
      return `I offer «${title}» (${cat}). Includes delivery per brief and revision rounds.`
    }
    return `«${title}» xizmatini taklif qilaman (${cat}). Texnik vazifa bo'yicha ish va tuzatishlar kiritiladi.`
  }
  if (lang === 'en') {
    return `Looking for a specialist for «${title}» (${cat}). Clear scope, milestones, and on-time delivery expected.`
  }
  return `«${title}» uchun ${cat} mutaxassisi kerak. Talablar, muddat va natija aniq bo'lsin.`
}
