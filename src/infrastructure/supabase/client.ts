import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseRequestDebugEnabled } from '@/shared/lib/supabase-request-debug'
import { instrumentBrowserClient } from '@/infrastructure/supabase/instrumented-browser-client'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL va anon/publishable key kerak')
  }

  const base = createBrowserClient(url, key)
  client = isSupabaseRequestDebugEnabled() ? instrumentBrowserClient(base) : base
  return client
}

function isPlaceholderSupabaseEnv(url?: string, key?: string): boolean {
  if (!url || !key) return true
  const normalizedUrl = url.toLowerCase()
  const normalizedKey = key.toLowerCase()
  return (
    normalizedUrl.includes('your_project') ||
    normalizedKey.includes('your-anon-key') ||
    normalizedKey.includes('your_publishable') ||
    normalizedKey === 'your-anon-key'
  )
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  return Boolean(url && key && !isPlaceholderSupabaseEnv(url, key))
}
