import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { dashboardPathForRole } from '@/domain/constants/routes'
import { trackMiddlewareSupabaseRequest } from '@/infrastructure/supabase/middleware-request-debug'
import {
  readProfileCache,
  writeProfileCache,
  type CachedProfile,
} from '@/infrastructure/supabase/middleware-profile-cache'
import { fetchSessionFlags } from '@/infrastructure/supabase/middleware-session-flags'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/onboarding',
  '/wallet',
  '/settings',
  '/services/create',
  '/messages',
]
const AUTH_PATHS = new Set(['/login', '/register'])
const MIDDLEWARE_AUTH_TIMEOUT_MS = 8_000

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

function isPublicPath(pathname: string): boolean {
  return !isProtected(pathname) && !AUTH_PATHS.has(pathname)
}

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
): Promise<{ data: { user: { id: string } | null } }> {
  try {
    return await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('middleware auth timeout')), MIDDLEWARE_AUTH_TIMEOUT_MS)
      }),
    ])
  } catch {
    return { data: { user: null } }
  }
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    const { pathname } = request.nextUrl
    if (isProtected(pathname)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'config')
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await getUserWithTimeout(supabase)

  trackMiddlewareSupabaseRequest({
    queryName: 'auth.getUser',
    pathname,
    component: 'proxy.ts/updateSession',
  })

  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let profileFresh: CachedProfile | null = null

  async function resolveProfileFlags(): Promise<CachedProfile | null> {
    const cached = await readProfileCache(request, user!.id)
    if (cached) return cached

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) return null

    trackMiddlewareSupabaseRequest({
      queryName: 'api.session-flags',
      pathname,
      component: 'proxy.ts/profile-flags',
    })
    const flags = await fetchSessionFlags(accessToken)
    if (!flags) return null

    profileFresh = flags
    return flags
  }

  async function withProfileCache(res: NextResponse): Promise<NextResponse> {
    if (user && profileFresh) {
      await writeProfileCache(res, user.id, profileFresh)
    }
    return res
  }

  if (user && AUTH_PATHS.has(pathname)) {
    const profile = await resolveProfileFlags()

    const dest =
      profile?.onboarding_completed === false && !profile?.is_admin
        ? '/onboarding'
        : dashboardPathForRole(profile?.role === 'client' ? 'client' : 'freelancer')
    return withProfileCache(NextResponse.redirect(new URL(dest, request.url)))
  }

  const onAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  if (user && isProtected(pathname)) {
    const profile = await resolveProfileFlags()

    if (onAdmin && !profile?.is_admin) {
      const deniedUrl = request.nextUrl.clone()
      deniedUrl.pathname = '/dashboard'
      deniedUrl.searchParams.set('admin_denied', '1')
      return withProfileCache(NextResponse.redirect(deniedUrl))
    }

    if (profile?.is_banned || profile?.is_suspended) {
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set(profile?.is_banned ? 'banned' : 'suspended', '1')
      return withProfileCache(NextResponse.redirect(loginUrl))
    }

    const onDashboard =
      pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    const onOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

    if (onOnboarding && profile?.onboarding_completed === true) {
      return withProfileCache(NextResponse.redirect(new URL('/', request.url)))
    }
  }

  return withProfileCache(response)
}
