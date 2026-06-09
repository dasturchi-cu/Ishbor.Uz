'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string
      remove: (id: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()

export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return

    const render = () => {
      if (!ref.current || !window.turnstile) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: onToken,
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = render
      document.head.appendChild(script)
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
      }
    }
  }, [onToken])

  if (!SITE_KEY) return null
  return <div ref={ref} className="mt-3" />
}

export function isTurnstileEnabled(): boolean {
  return Boolean(SITE_KEY)
}
