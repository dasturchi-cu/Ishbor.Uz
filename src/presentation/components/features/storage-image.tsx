'use client'

import { useEffect, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import { resolvePrivateStorageLocation } from '@/shared/lib/chat-storage-ref'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

type StorageImageProps = {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function StorageImage({ src, alt, className, fallbackClassName }: StorageImageProps) {
  const storage = resolvePrivateStorageLocation(src)
  const storageKey = storage ? `${storage.bucket}:${storage.path}` : null
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(storageKey ? null : src)
  const [loading, setLoading] = useState(Boolean(storageKey))

  useEffect(() => {
    const loc = resolvePrivateStorageLocation(src)
    if (!loc) {
      setResolvedUrl(src)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .getStorageSignedUrl(loc.bucket, loc.path)
      .then((res) => {
        if (!cancelled) setResolvedUrl(res.url)
      })
      .catch((e) => {
        ignoreWithLog(e, { scope: 'storage', apiPath: '/api/v1/platform/storage/signed-url' })
        if (!cancelled) setResolvedUrl(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [src, storageKey])

  if (loading) {
    return <div className={fallbackClassName ?? className} aria-hidden />
  }

  if (!resolvedUrl) {
    return null
  }

  return <img src={resolvedUrl} alt={alt} className={className} />
}
