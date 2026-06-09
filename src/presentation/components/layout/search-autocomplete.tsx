'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Search } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import { PATHS, servicePath } from '@/domain/constants/routes'
import { getSearchHistory, pushSearchHistory } from '@/shared/lib/search-history'
import { cn } from '@/shared/lib/utils'

interface SearchAutocompleteProps {
  value: string
  onChange: (v: string) => void
  onSubmit: (e?: React.FormEvent) => void
  placeholder: string
  className?: string
  inputClassName?: string
  variant?: 'header' | 'hero' | 'catalog'
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  inputClassName,
  variant = 'header',
}: SearchAutocompleteProps) {
  const { t } = useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<{ id: string; title: string }[]>([])
  const [history, setHistory] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [open])

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const id = setTimeout(() => {
      api
        .listServices({ search: q, limit: 5, offset: 0 })
        .then((res) => setSuggestions(res.items.map((s) => ({ id: s.id, title: s.title }))))
        .catch(() => setSuggestions([]))
    }, 250)
    return () => clearTimeout(id)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      router.push(PATHS.services)
      return
    }
    pushSearchHistory(trimmed)
    onChange(trimmed)
    setOpen(false)
    router.push(`${PATHS.services}?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (value.trim()) pushSearchHistory(value.trim())
    setOpen(false)
    onSubmit(e)
  }

  const isHeader = variant === 'header'
  const isCatalog = variant === 'catalog'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        {isCatalog ? (
          <div className="catalog-search">
            <Search className="catalog-search__icon" strokeWidth={2.25} aria-hidden />
            <input
              type="text"
              className={cn('catalog-search__input input-touch', inputClassName)}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              aria-label={placeholder}
              autoComplete="off"
            />
          </div>
        ) : (
          <div className={isHeader ? 'ishbor-header-search' : 'ishbor-hero-search'}>
            <div className={isHeader ? 'ishbor-header-search-field' : 'ishbor-hero-search-field'}>
              <Search className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
              <input
                type="text"
                className={cn('ishbor-search-input input-touch', inputClassName)}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                aria-label={placeholder}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className={isHeader ? 'ishbor-header-search-btn' : 'ishbor-hero-search-btn'}
              aria-label={placeholder}
            >
              {isHeader ? <Search className="h-[18px] w-[18px]" strokeWidth={2.25} /> : t('hero_search_btn')}
            </button>
          </div>
        )}
      </form>

      {open && (history.length > 0 || suggestions.length > 0) && (
        <div className="search-autocomplete-panel">
          {history.length > 0 && !value.trim() && (
            <div className="search-autocomplete-section">
              <p className="search-autocomplete-label">{t('search_recent')}</p>
              {history.map((h) => (
                <button key={h} type="button" className="search-autocomplete-item" onClick={() => goSearch(h)}>
                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="search-autocomplete-section">
              <p className="search-autocomplete-label">{t('search_suggestions')}</p>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="search-autocomplete-item"
                  onClick={() => {
                    setOpen(false)
                    router.push(servicePath(s.id))
                  }}
                >
                  <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
              {value.trim().length >= 2 && (
                <button
                  type="button"
                  className="search-autocomplete-item font-medium text-[var(--color-primary)]"
                  onClick={() => goSearch(value)}
                >
                  {t('search_see_all')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
