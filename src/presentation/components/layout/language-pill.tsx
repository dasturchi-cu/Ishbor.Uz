'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const LANG_OPTIONS = [
  { code: 'uz' as const, label: "O'zbek" },
  { code: 'ru' as const, label: 'Русский' },
  { code: 'en' as const, label: 'English' },
]

type LangCode = (typeof LANG_OPTIONS)[number]['code']

export function LanguagePill({
  language,
  setLanguage,
  className,
}: {
  language: LangCode
  setLanguage: (l: LangCode) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANG_OPTIONS.find((l) => l.code === language) ?? LANG_OPTIONS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (code: LangCode) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language"
        className={cn(
          'header-control-pill header-lang-pill',
          open && 'header-control-pill--open'
        )}
      >
        <Globe className="header-lang-pill-globe" aria-hidden />
        <span className="header-lang-pill-code">{current.code.toUpperCase()}</span>
        <ChevronDown
          className={cn('header-control-pill-chevron', open && 'header-control-pill-chevron--open')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[148px] overflow-hidden rounded-lg border border-[var(--ishbor-border)] bg-[var(--neutral-0)] py-1 shadow-[var(--shadow-md)]"
        >
          {LANG_OPTIONS.map((lang) => {
            const active = language === lang.code
            return (
              <li key={lang.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    'flex w-full items-center gap-2.5 border-b border-[var(--ishbor-border)] px-3 py-2.5 text-left text-[13px] transition last:border-b-0',
                    active
                      ? 'bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--ishbor-text)] hover:bg-[var(--neutral-50)]'
                  )}
                >
                  <span className="w-7 shrink-0 text-[11px] font-bold uppercase">
                    {lang.code}
                  </span>
                  <span className="flex-1">{lang.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
