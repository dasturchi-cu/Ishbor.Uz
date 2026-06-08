'use client'

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { useEscapeClose } from '@/shared/lib/use-escape-close'

export type PortfolioLightboxItem = {
  url: string
  title: string
  serviceId?: string
}

export function PortfolioLightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
  openServiceLabel,
  onOpenService,
  closeAriaLabel = 'Close',
}: {
  items: PortfolioLightboxItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  openServiceLabel?: string
  onOpenService?: (serviceId: string) => void
  closeAriaLabel?: string
}) {
  const item = items[index]
  useEscapeClose(true, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])

  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute -top-10 right-0 rounded-full p-2 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label={closeAriaLabel}
        >
          <X className="h-6 w-6" />
        </button>
        <img
          src={item.url}
          alt={item.title}
          className="max-h-[75vh] w-full rounded-lg object-contain"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] font-medium text-white">{item.title}</p>
          <div className="flex gap-2">
            {items.length > 1 && (
              <>
                <Button variant="outline" size="sm" onClick={onPrev} aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="self-center text-[12px] text-white/80">
                  {index + 1} / {items.length}
                </span>
                <Button variant="outline" size="sm" onClick={onNext} aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {item.serviceId && onOpenService && openServiceLabel && (
              <Button variant="primary" size="sm" onClick={() => onOpenService(item.serviceId!)}>
                {openServiceLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
