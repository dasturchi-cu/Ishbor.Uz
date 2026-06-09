'use client'

import { cn } from '@/shared/lib/utils'

export interface AdminTabItem {
  id: string
  label: string
  count?: number
}

export function AdminTabs({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: AdminTabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-1',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'min-h-10 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
            activeId === tab.id
              ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm'
              : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]',
          )}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span className="ml-1.5 rounded-full bg-[var(--admin-warning)]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--admin-warning)]">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
