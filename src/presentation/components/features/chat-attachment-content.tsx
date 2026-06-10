'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Paperclip } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import { parseChatStorageRef } from '@/shared/lib/chat-storage-ref'
import { isAllowedExternalUrl } from '@/shared/lib/safe-url'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

function messageAttachmentUrl(content: string): string | null {
  const match = content.match(/https?:\/\/\S+/i)
  if (!match) return null
  const url = match[0].replace(/[),.]+$/, '')
  return isAllowedExternalUrl(url) ? url : null
}

function messageImageUrl(content: string): string | null {
  const url = messageAttachmentUrl(content)
  if (!url) return null
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return url
  return null
}

export function ChatAttachmentContent({ content }: { content: string }) {
  const { t } = useApp()
  const storageRef = parseChatStorageRef(content)
  const bucket = storageRef?.bucket
  const path = storageRef?.path
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(bucket && path))

  useEffect(() => {
    if (!bucket || !path) {
      setResolvedUrl(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .getStorageSignedUrl(bucket, path)
      .then((res) => {
        if (!cancelled) setResolvedUrl(res.url)
      })
      .catch((e) => {
        ignoreWithLog(e, { scope: 'messages', apiPath: '/api/v1/platform/storage/signed-url' })
        if (!cancelled) setResolvedUrl(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bucket, path])

  if (bucket && path) {
    if (loading) {
      return <span className="text-[12px] text-[var(--ishbor-text-muted)]">…</span>
    }
    if (!resolvedUrl) {
      return <span className="text-[12px] text-[var(--ishbor-text-muted)]">{t('chat_attachment_file')}</span>
    }
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(path)) {
      return (
        <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={resolvedUrl}
            alt={t('chat_attachment_image')}
            className="max-h-48 max-w-full rounded-md object-cover"
          />
        </a>
      )
    }
    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium underline"
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
        {t('chat_attachment_file')}
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    )
  }

  const img = messageImageUrl(content)
  if (img) {
    return (
      <a href={img} target="_blank" rel="noopener noreferrer">
        <img
          src={img}
          alt={t('chat_attachment_image')}
          className="max-h-48 max-w-full rounded-md object-cover"
        />
      </a>
    )
  }

  const fileUrl = messageAttachmentUrl(content)
  if (fileUrl) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium underline"
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
        {t('chat_attachment_file')}
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    )
  }

  return <span>{content}</span>
}
