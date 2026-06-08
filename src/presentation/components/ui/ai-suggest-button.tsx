'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { toast } from '@/presentation/components/ui/toast'
import { fetchAiSuggestion, type AiSuggestContext, type AiSuggestKind } from '@/shared/lib/ai-suggest'

export function AiSuggestButton({
  kind,
  context,
  onApply,
  className,
}: {
  kind: AiSuggestKind
  context: AiSuggestContext
  onApply: (text: string) => void
  className?: string
}) {
  const { t, language } = useApp()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (kind === 'service_title' && !context.category?.trim()) {
      toast.error(t('ai_suggest_need_category'))
      return
    }
    if (kind === 'profile_bio' && !context.specialty?.trim() && !context.title?.trim()) {
      toast.error(t('ai_suggest_need_specialty'))
      return
    }
    if (
      !context.title?.trim() &&
      kind !== 'service_title' &&
      kind !== 'profile_bio'
    ) {
      toast.error(t('ai_suggest_need_title'))
      return
    }
    setLoading(true)
    try {
      const text = await fetchAiSuggestion(kind, { ...context, language })
      onApply(text)
      toast.success(t('ai_suggest_applied'))
    } catch {
      toast.error(t('ai_suggest_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={loading}
      className={className ?? 'gap-1.5'}
      onClick={() => void handleClick()}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {loading ? t('ai_suggest_loading') : t('ai_suggest_btn')}
    </Button>
  )
}
