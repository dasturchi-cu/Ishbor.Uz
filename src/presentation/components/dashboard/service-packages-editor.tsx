'use client'

import { useApp } from '@/application/providers/app-provider'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import type { ApiServicePackage } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'
import { PACKAGE_DEFS } from '@/shared/lib/service-packages'

interface ServicePackagesEditorProps {
  packages: ApiServicePackage[]
  onChange: (next: ApiServicePackage[]) => void
  onResetSuggested?: () => void
  disabled?: boolean
}

export function ServicePackagesEditor({
  packages,
  onChange,
  onResetSuggested,
  disabled = false,
}: ServicePackagesEditorProps) {
  const { t } = useApp()

  const updatePackage = (id: string, field: 'price' | 'delivery_days', raw: string) => {
    const parsed =
      field === 'price'
        ? parseInt(raw.replace(/\D/g, ''), 10) || 0
        : Math.min(365, Math.max(1, parseInt(raw, 10) || 1))
    onChange(
      packages.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: parsed,
            }
          : p
      )
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-[var(--kwork-text)]">{t('packages_section_title')}</p>
          <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('packages_editor_hint')}</p>
        </div>
        {onResetSuggested && (
          <Button variant="outline" size="sm" type="button" disabled={disabled} onClick={onResetSuggested}>
            {t('packages_reset_suggested')}
          </Button>
        )}
      </div>
      <div className="space-y-3 rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-50)] p-3">
        {PACKAGE_DEFS.map((def) => {
          const row = packages.find((p) => p.id === def.id)
          if (!row) return null
          return (
            <div
              key={def.id}
              className="grid gap-3 border-b border-[var(--kwork-border)] pb-3 last:border-0 last:pb-0 sm:grid-cols-[120px_1fr_1fr]"
            >
              <p className="self-center text-[13px] font-semibold text-[var(--kwork-text)]">
                {t(def.label_key as TranslationKey)}
              </p>
              <Input
                label={t('package_price_label')}
                value={row.price > 0 ? String(row.price) : ''}
                onChange={(e) => updatePackage(def.id, 'price', e.target.value)}
                inputMode="numeric"
                disabled={disabled}
              />
              <Input
                label={t('delivery_time')}
                type="number"
                min={1}
                max={365}
                value={String(row.delivery_days)}
                onChange={(e) => updatePackage(def.id, 'delivery_days', e.target.value)}
                disabled={disabled}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
