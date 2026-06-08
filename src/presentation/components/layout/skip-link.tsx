'use client'

import { useApp } from '@/application/providers/app-provider'

export function SkipLink() {
  const { t } = useApp()
  return (
    <a href="#main-content" className="skip-link">
      {t('skip_to_content')}
    </a>
  )
}
