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
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(storage ? null : src)
  const [loading, setLoading] = useState(Boolean(storage))

  useEffect(() => {
    if (!storage) {
      setResolvedUrl(src)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .getStorageSignedUrl(storage.bucket, storage.path)
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
  }, [src, storage?.bucket, storage?.path])

  if (loading) {
    return <div className={fallbackClassName ?? className} aria-hidden />
  }

  if (!resolvedUrl) {
    return null
  }

  return <img src={resolvedUrl} alt={alt} className={className} />
}
