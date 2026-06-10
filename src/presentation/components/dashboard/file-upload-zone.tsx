'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'
import { StorageImage } from '@/presentation/components/features/storage-image'

export interface FileUploadZoneProps {
  accept?: string
  maxFiles?: number
  maxSizeMb?: number
  circular?: boolean
  className?: string
  disabled?: boolean
  initialUrls?: string[]
  onFilesChange?: (files: File[]) => void
  /** Yuklangan URL lar o'zgarganda (o'chirish yoki yangi yuklash) */
  onUrlsChange?: (urls: string[]) => void
  /** Yuklash + URL qaytarish (Supabase Storage) */
  onUpload?: (files: File[]) => Promise<string[]>
}

export function FileUploadZone({
  accept = 'image/*',
  maxFiles = 5,
  maxSizeMb = 10,
  circular = false,
  className,
  disabled = false,
  initialUrls = [],
  onFilesChange,
  onUrlsChange,
  onUpload,
}: FileUploadZoneProps) {
  const { t } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>(initialUrls)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialUrls)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const initialKey = initialUrls.join('\0')

  useEffect(() => {
    // Bo'sh [] har renderda yangi reference — local preview ni o'chirmaslik
    if (initialUrls.length === 0) return
    setPreviews((prev) => {
      prev.forEach((p) => {
        if (p.startsWith('blob:')) URL.revokeObjectURL(p)
      })
      return initialUrls
    })
    setUploadedUrls(initialUrls)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialKey stabilizes initialUrls (bo'sh [] reference)
  }, [initialKey])

  const handleFiles = useCallback(
    async (incoming: FileList | null) => {
      if (!incoming?.length || disabled) return
      setError('')
      const next: File[] = []
      for (const file of Array.from(incoming)) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          setError(`${file.name}: max ${maxSizeMb}MB`)
          continue
        }
        next.push(file)
      }
      const merged = [...files, ...next].slice(0, maxFiles)
      previews.forEach((p) => {
        if (p.startsWith('blob:')) URL.revokeObjectURL(p)
      })
      setFiles(merged)
      onFilesChange?.(merged)

      if (onUpload && merged.length > 0) {
        setUploading(true)
        try {
          const urls = await onUpload(merged)
          if (urls.length > 0) {
            setUploadedUrls(urls)
            setPreviews(urls)
            onUrlsChange?.(urls)
            setFiles([])
          } else {
            setPreviews(merged.map((f) => URL.createObjectURL(f)))
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : t('error_required'))
          setPreviews(merged.map((f) => URL.createObjectURL(f)))
        } finally {
          setUploading(false)
        }
      } else {
        setPreviews(merged.map((f) => URL.createObjectURL(f)))
      }
    },
    [disabled, files, maxFiles, maxSizeMb, onFilesChange, onUrlsChange, onUpload, previews, t]
  )

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    const nextPreviews = previews.filter((_, i) => i !== index)
    const nextUrls = uploadedUrls.filter((_, i) => i !== index)
    if (previews[index]?.startsWith('blob:')) URL.revokeObjectURL(previews[index])
    setFiles(next)
    setPreviews(nextPreviews)
    setUploadedUrls(nextUrls)
    onUrlsChange?.(nextUrls)
    onFilesChange?.(next)
  }

  const displayPreview = previews[0]

  if (circular && displayPreview) {
    return (
      <div className={cn('relative mx-auto h-24 w-24', className)}>
        {displayPreview.startsWith('blob:') ? (
          <img
            src={displayPreview}
            alt=""
            className="h-24 w-24 rounded-full border-2 border-[var(--ishbor-border)] object-cover"
          />
        ) : (
          <StorageImage
            src={displayPreview}
            alt=""
            className="h-24 w-24 rounded-full border-2 border-[var(--ishbor-border)] object-cover"
          />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        {!disabled && !uploading && (
          <button
            type="button"
            onClick={() => removeAt(0)}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--error)] text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center border-2 border-dashed border-[var(--ishbor-border)] bg-[var(--neutral-50)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
          circular ? 'mx-auto h-24 w-24 rounded-full p-2' : 'rounded-[var(--r-card)] px-6 py-10',
          (disabled || uploading) && 'cursor-not-allowed opacity-60'
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        ) : (
          <Upload className={cn('text-[var(--color-primary)]', circular ? 'h-5 w-5' : 'h-8 w-8')} />
        )}
        {!circular && (
          <>
            <p className="mt-3 text-[14px] font-medium text-[var(--ishbor-text)]">{t('drag_or_click')}</p>
            <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">PNG, JPG (max {maxSizeMb}MB)</p>
          </>
        )}
        {circular && (
          <span className="mt-1 text-[10px] font-medium text-[var(--ishbor-text-muted)]">{t('upload_photo')}</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-[var(--error)]">{error}</p>}
      {!circular && previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-square overflow-hidden rounded-[var(--r-card)] border border-[var(--ishbor-border)]"
            >
              {src.startsWith('blob:') ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <StorageImage src={src} alt="" className="h-full w-full object-cover" />
              )}
              {!disabled && !uploading && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
