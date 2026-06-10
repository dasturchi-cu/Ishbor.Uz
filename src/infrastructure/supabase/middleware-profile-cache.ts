import type { NextRequest, NextResponse } from 'next/server'

export const PROFILE_CACHE_COOKIE = 'ishbor-pf'
const TTL_SEC = 30

export type CachedProfile = {
  is_banned: boolean
  is_admin: boolean
  onboarding_completed: boolean
  role?: 'freelancer' | 'client'
}

type CachePayload = CachedProfile & { uid: string; exp: number }

function cacheSecret(): string {
  return (
    process.env.MIDDLEWARE_CACHE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    'ishbor-dev-cache'
  )
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const pad = encoded.length % 4 === 0 ? '' : '='.repeat(4 - (encoded.length % 4))
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + pad
  return atob(b64)
}

async function hmacSign(message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(cacheSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  const bytes = new Uint8Array(sig)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function readProfileCache(
  request: NextRequest,
  userId: string,
): Promise<CachedProfile | null> {
  const raw = request.cookies.get(PROFILE_CACHE_COOKIE)?.value
  if (!raw) return null
  const dot = raw.lastIndexOf('.')
  if (dot < 0) return null
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  try {
    const expected = await hmacSign(body)
    if (expected !== sig) return null
    const payload = JSON.parse(fromBase64Url(body)) as CachePayload
    if (payload.uid !== userId) return null
    if (payload.exp < Date.now()) return null
    return {
      is_banned: Boolean(payload.is_banned),
      is_admin: Boolean(payload.is_admin),
      onboarding_completed: Boolean(payload.onboarding_completed),
      role: payload.role === 'client' ? 'client' : payload.role === 'freelancer' ? 'freelancer' : undefined,
    }
  } catch {
    return null
  }
}

export async function writeProfileCache(
  response: NextResponse,
  userId: string,
  profile: CachedProfile,
): Promise<void> {
  const payload: CachePayload = {
    uid: userId,
    exp: Date.now() + TTL_SEC * 1000,
    ...profile,
  }
  const body = toBase64Url(JSON.stringify(payload))
  const sig = await hmacSign(body)
  response.cookies.set(PROFILE_CACHE_COOKIE, `${body}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TTL_SEC,
    path: '/',
  })
}
